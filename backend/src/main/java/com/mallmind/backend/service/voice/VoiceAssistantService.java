package com.mallmind.backend.service.voice;

import com.mallmind.backend.client.ModelServiceClient;
import com.mallmind.backend.domain.entity.Facility;
import com.mallmind.backend.domain.entity.NavigationNode;
import com.mallmind.backend.domain.enums.FacilityType;
import com.mallmind.backend.dto.navigation.RouteResponse;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.product.ProductSearchCriteria;
import com.mallmind.backend.dto.shop.ShopResponse;
import com.mallmind.backend.dto.shop.ShopSearchCriteria;
import com.mallmind.backend.dto.voice.IntentResult;
import com.mallmind.backend.dto.voice.VoiceQueryResult;
import com.mallmind.backend.repository.FacilityRepository;
import com.mallmind.backend.repository.NavigationNodeRepository;
import com.mallmind.backend.service.ProductService;
import com.mallmind.backend.service.ShopService;
import com.mallmind.backend.service.navigation.NavigationGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Conversational orchestrator for the voice assistant (Part 15). This is
 * the first place the Java backend actually calls the Python model-service
 * (ModelServiceClient -- /nlu/intent, /voice/*): early groundwork for
 * Phase 9, triggered here because the voice assistant can't work without
 * it. The model-service only returns understanding (intent + entities);
 * every fact in a response (prices, stock, shop names, routes) is looked
 * up through this backend's own services, which remain the single system
 * of record (see model-service/app/main.py's module docstring).
 */
@Service
@RequiredArgsConstructor
public class VoiceAssistantService {

    private static final double CLARIFICATION_CONFIDENCE_FLOOR = 0.4;
    private static final Set<String> FRESH_SEARCH_INTENTS =
            Set.of("PRODUCT_SEARCH", "SHOP_SEARCH", "NAVIGATION", "FACILITY_SEARCH", "PRODUCT_COMPARE");
    private static final String ENTRANCE_QR_CODE = "QR-G-ENTRANCE";

    private static final Map<String, FacilityType> FACILITY_WORD_TO_TYPE = Map.of(
            "washroom", FacilityType.WASHROOM,
            "atm", FacilityType.ATM,
            "food court", FacilityType.FOOD_COURT,
            "parking", FacilityType.PARKING_ACCESS,
            "customer service desk", FacilityType.CUSTOMER_SERVICE);

    /** Spoken-friendly form with an article, e.g. "an ATM" / "a washroom". */
    private static final Map<String, String> FACILITY_WORD_SPOKEN = Map.of(
            "washroom", "a washroom",
            "atm", "an ATM",
            "food court", "the food court",
            "parking", "the parking access point",
            "customer service desk", "a customer service desk");

    private final ModelServiceClient modelServiceClient;
    private final VoiceSessionService sessionService;
    private final ProductService productService;
    private final ShopService shopService;
    private final FacilityRepository facilityRepository;
    private final NavigationNodeRepository navigationNodeRepository;
    private final NavigationGraphService navigationGraphService;

    private volatile Long entranceNodeId;

    public VoiceQueryResult handleAudio(String sessionId, byte[] audioBytes, String filename) {
        String transcript = modelServiceClient.transcribe(audioBytes, filename);
        VoiceQueryResult result = handleText(sessionId, transcript);
        return new VoiceQueryResult(result.sessionId(), transcript, result.intent(), result.confidence(),
                result.lowConfidence(), result.entities(), result.responseText(), result.data());
    }

    public VoiceQueryResult handleText(String sessionId, String text) {
        String effectiveSessionId = sessionId != null && !sessionId.isBlank() ? sessionId : sessionService.newSessionId();
        IntentResult nlu = modelServiceClient.classifyIntent(text);

        if (nlu.lowConfidence() || nlu.confidence() < CLARIFICATION_CONFIDENCE_FLOOR) {
            String clarification = "I'm not fully sure what you meant. You can try something like "
                    + "\"find me running shoes under 3000 rupees\" or \"where is the nearest ATM?\".";
            return new VoiceQueryResult(effectiveSessionId, null, nlu.intent(), nlu.confidence(), true,
                    nlu.entities(), clarification, null);
        }

        VoiceSlots slots = sessionService.slotsFor(effectiveSessionId);
        boolean freshSearch = FRESH_SEARCH_INTENTS.contains(nlu.intent());
        slots.applyEntities(nlu.entities(), freshSearch);

        Dispatched dispatched = switch (nlu.intent()) {
            case "PRODUCT_SEARCH", "REFINE_SEARCH" -> handleProductSearch(slots);
            case "SHOP_SEARCH" -> handleShopSearch(slots);
            case "NAVIGATION" -> handleNavigation(slots);
            case "FACILITY_SEARCH" -> handleFacilitySearch(slots);
            case "PRODUCT_COMPARE" -> new Dispatched(
                    "Voice-based comparison isn't supported yet -- please select products to compare from the search results.",
                    null);
            default -> new Dispatched("Sorry, I don't know how to help with that yet.", null);
        };

        return new VoiceQueryResult(effectiveSessionId, null, nlu.intent(), nlu.confidence(), false,
                nlu.entities(), dispatched.responseText(), dispatched.data());
    }

    public byte[] synthesize(String text) {
        return modelServiceClient.synthesizeSpeech(text);
    }

    private Dispatched handleProductSearch(VoiceSlots slots) {
        BigDecimal maxPrice = slots.getMaxBudget() != null ? BigDecimal.valueOf(slots.getMaxBudget()) : null;
        var criteria = new ProductSearchCriteria(null, slots.getBrand(), slots.getCategory(), slots.getColor(), null, maxPrice);
        List<ProductResponse> results = productService.search(criteria);

        if (results.isEmpty()) {
            return new Dispatched(describeNoProducts(slots), results);
        }

        List<ProductResponse> top = results.subList(0, Math.min(3, results.size()));
        StringBuilder sb = new StringBuilder("I found " + results.size() + " product" + (results.size() == 1 ? "" : "s")
                + (slots.getCategory() != null ? " in " + slots.getCategory() : "") + ". Top matches: ");
        for (int i = 0; i < top.size(); i++) {
            ProductResponse p = top.get(i);
            sb.append(p.name()).append(" at ₹").append(p.effectivePrice());
            if (i < top.size() - 1) sb.append("; ");
        }
        return new Dispatched(sb.toString(), results);
    }

    private String describeNoProducts(VoiceSlots slots) {
        StringBuilder sb = new StringBuilder("I couldn't find any products");
        if (slots.getCategory() != null) sb.append(" in ").append(slots.getCategory());
        if (slots.getBrand() != null) sb.append(" from ").append(slots.getBrand());
        if (slots.getColor() != null) sb.append(" in ").append(slots.getColor());
        if (slots.getMaxBudget() != null) sb.append(" under ₹").append(slots.getMaxBudget().longValue());
        sb.append(" in the current catalogue.");
        return sb.toString();
    }

    private Dispatched handleShopSearch(VoiceSlots slots) {
        var criteria = new ShopSearchCriteria(slots.getShop(), slots.getCategory(), null);
        List<ShopResponse> results = shopService.search(criteria);

        if (results.isEmpty()) {
            return new Dispatched("I couldn't find any shops matching that.", results);
        }
        List<ShopResponse> top = results.subList(0, Math.min(3, results.size()));
        StringBuilder sb = new StringBuilder("I found " + results.size() + " shop" + (results.size() == 1 ? "" : "s") + ": ");
        for (int i = 0; i < top.size(); i++) {
            ShopResponse s = top.get(i);
            sb.append(s.name()).append(" on Floor ").append(s.floorNumber());
            if (i < top.size() - 1) sb.append("; ");
        }
        return new Dispatched(sb.toString(), results);
    }

    private Dispatched handleNavigation(VoiceSlots slots) {
        Long targetNodeId = null;

        if (slots.getShop() != null) {
            List<ShopResponse> matches = shopService.search(new ShopSearchCriteria(slots.getShop(), null, null));
            if (!matches.isEmpty()) {
                targetNodeId = matches.get(0).navigationNodeId();
            }
        } else if (slots.getFacility() != null) {
            targetNodeId = resolveFacilityNodeId(slots.getFacility());
        }

        if (targetNodeId == null) {
            return new Dispatched("Which shop or facility would you like directions to?", null);
        }

        RouteResponse route = navigationGraphService.findRoute(resolveEntranceNodeId(), targetNodeId);
        String spoken = "Starting from the main entrance: " + String.join(" ", route.spokenDirections());
        return new Dispatched(spoken, route);
    }

    private Dispatched handleFacilitySearch(VoiceSlots slots) {
        if (slots.getFacility() == null) {
            return new Dispatched(
                    "Which facility are you looking for -- a washroom, ATM, food court, parking, or customer service desk?",
                    null);
        }
        FacilityType type = FACILITY_WORD_TO_TYPE.get(slots.getFacility());
        if (type == null) {
            return new Dispatched("I can only help locate washrooms, ATMs, the food court, parking access and "
                    + "customer service desks via voice right now -- not " + slots.getFacility() + ".", null);
        }
        List<Facility> facilities = facilityRepository.findByTypeWithFloorAndNode(type);
        if (facilities.isEmpty()) {
            return new Dispatched("I couldn't find a " + slots.getFacility() + " in the mall directory.", null);
        }
        Facility facility = facilities.get(0);
        RouteResponse route = navigationGraphService.findRoute(resolveEntranceNodeId(), facility.getNavigationNode().getId());
        String spoken = "There's " + FACILITY_WORD_SPOKEN.getOrDefault(slots.getFacility(), slots.getFacility())
                + " on Floor " + facility.getFloor().getFloorNumber()
                + ". Starting from the main entrance: " + String.join(" ", route.spokenDirections());
        return new Dispatched(spoken, route);
    }

    private Long resolveFacilityNodeId(String facilityWord) {
        FacilityType type = FACILITY_WORD_TO_TYPE.get(facilityWord);
        if (type == null) {
            return null;
        }
        List<Facility> facilities = facilityRepository.findByTypeWithFloorAndNode(type);
        return facilities.isEmpty() ? null : facilities.get(0).getNavigationNode().getId();
    }

    /** No real indoor positioning exists yet (Part 15 doesn't require GPS/BLE
     * beacons), so every voice route starts from the main entrance -- a
     * documented limitation, not a fabricated "current location". */
    private Long resolveEntranceNodeId() {
        Long cached = entranceNodeId;
        if (cached != null) {
            return cached;
        }
        NavigationNode entrance = navigationNodeRepository.findByQrCode(ENTRANCE_QR_CODE)
                .orElseThrow(() -> new IllegalStateException("Seed data is missing the main entrance node (" + ENTRANCE_QR_CODE + ")"));
        entranceNodeId = entrance.getId();
        return entranceNodeId;
    }

    private record Dispatched(String responseText, Object data) {
    }
}
