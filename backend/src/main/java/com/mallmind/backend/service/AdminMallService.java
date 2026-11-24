package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.*;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.domain.enums.RoleName;
import com.mallmind.backend.dto.admin.*;
import com.mallmind.backend.exception.ShopNotFoundException;
import com.mallmind.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminMallService {

    private final ShopRepository shopRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NavigationNodeRepository navigationNodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalStores = shopRepository.count();
        long activeStores = shopRepository.findByActiveTrue().size();
        long inactiveStores = totalStores - activeStores;
        int totalFloors = (int) floorRepository.count();
        long totalFacilities = facilityRepository.count();
        long totalProducts = productRepository.count();

        Role retailerRole = roleRepository.findByName(RoleName.RETAILER).orElse(null);
        long activeRetailers = (retailerRole != null)
                ? userRepository.findAll().stream().filter(u -> u.isEnabled() && u.hasRole(RoleName.RETAILER)).count()
                : 0;

        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.totalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (OrderStatus st : OrderStatus.values()) {
            ordersByStatus.put(st.name(), orderRepository.countByStatus(st));
        }

        Map<String, Long> categoryBreakdown = new LinkedHashMap<>();
        for (ProductCategory pc : productCategoryRepository.findAll()) {
            categoryBreakdown.put(pc.getName(), (long) productRepository.findByCategoryId(pc.getId()).size());
        }

        long lowStockCount = productRepository.findAll().stream()
                .filter(p -> p.isAvailable() && p.getStockQuantity() > 0 && p.getStockQuantity() <= 5)
                .count();

        long outOfStockCount = productRepository.findAll().stream()
                .filter(p -> !p.isAvailable() || p.getStockQuantity() == 0)
                .count();

        return new DashboardStatsResponse(
                totalStores,
                activeStores,
                inactiveStores,
                totalFloors,
                totalFacilities,
                totalProducts,
                activeRetailers,
                totalUsers,
                totalOrders,
                totalRevenue,
                ordersByStatus,
                categoryBreakdown,
                lowStockCount,
                outOfStockCount,
                "DATABASE_TRUTH",
                false
        );
    }

    @Transactional(readOnly = true)
    public List<FloorOverviewResponse> listFloorsWithStats() {
        List<Floor> floors = floorRepository.findAllByOrderByFloorNumberAsc();
        List<Shop> allShops = shopRepository.findAll();
        List<Facility> allFacilities = facilityRepository.findAll();

        return floors.stream().map(f -> {
            long sc = allShops.stream().filter(s -> s.getFloor().getId().equals(f.getId())).count();
            long fc = allFacilities.stream().filter(fac -> fac.getFloor().getId().equals(f.getId())).count();
            return new FloorOverviewResponse(
                    f.getId(),
                    f.getFloorNumber(),
                    f.getLabel(),
                    sc,
                    fc,
                    f.getPlanWidth(),
                    f.getPlanHeight());
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<ShopAdminResponse> listShops(Integer floorNumber, String category, Boolean active, String query) {
        return shopRepository.findAll().stream()
                .filter(s -> floorNumber == null || s.getFloor().getFloorNumber() == floorNumber)
                .filter(s -> category == null || category.isBlank() || s.getCategory().equalsIgnoreCase(category))
                .filter(s -> active == null || s.isActive() == active)
                .filter(s -> query == null || query.isBlank() || s.getName().toLowerCase().contains(query.toLowerCase()))
                .map(this::toShopAdminResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShopAdminResponse getShop(Long id) {
        Shop s = shopRepository.findById(id).orElseThrow(() -> new ShopNotFoundException(id));
        return toShopAdminResponse(s);
    }

    public ShopAdminResponse updateShopMetadata(User admin, Long id, ShopUpdateRequest req) {
        Shop s = shopRepository.findById(id).orElseThrow(() -> new ShopNotFoundException(id));
        if (req.name() != null && !req.name().isBlank()) s.setName(req.name());
        if (req.category() != null && !req.category().isBlank()) s.setCategory(req.category());
        if (req.description() != null) s.setDescription(req.description());
        if (req.logoUrl() != null) s.setLogoUrl(req.logoUrl());
        if (req.openingTime() != null) s.setOpeningTime(req.openingTime());
        if (req.closingTime() != null) s.setClosingTime(req.closingTime());

        Shop saved = shopRepository.save(s);
        auditLogService.record(
                admin.getEmail(), "ADMIN", "STORE_METADATA_UPDATED", "SHOP",
                String.valueOf(s.getId()), "Updated metadata for store '" + s.getName() + "'", "SUCCESS"
        );
        return toShopAdminResponse(saved);
    }

    public ShopAdminResponse toggleShopStatus(User admin, Long id, boolean active) {
        Shop s = shopRepository.findById(id).orElseThrow(() -> new ShopNotFoundException(id));
        s.setActive(active);
        Shop saved = shopRepository.save(s);

        auditLogService.record(
                admin.getEmail(), "ADMIN", "STORE_STATUS_CHANGED", "SHOP",
                String.valueOf(s.getId()), "Store '" + s.getName() + "' active set to: " + active, "SUCCESS"
        );
        return toShopAdminResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FacilityAdminResponse> listFacilities(Integer floorNumber) {
        return facilityRepository.findAll().stream()
                .filter(fac -> floorNumber == null || fac.getFloor().getFloorNumber() == floorNumber)
                .map(this::toFacilityAdminResponse)
                .toList();
    }

    public FacilityAdminResponse createFacility(User admin, FacilityCreateRequest req) {
        Floor floor = floorRepository.findByFloorNumber(req.floorNumber())
                .orElseThrow(() -> new IllegalArgumentException("Floor not found: " + req.floorNumber()));
        NavigationNode node = navigationNodeRepository.findById(req.navigationNodeId())
                .orElseThrow(() -> new IllegalArgumentException("Navigation node not found: " + req.navigationNodeId()));

        Facility facility = Facility.builder()
                .floor(floor)
                .type(req.type())
                .label(req.label())
                .navigationNode(node)
                .build();
        Facility saved = facilityRepository.save(facility);

        auditLogService.record(
                admin.getEmail(), "ADMIN", "FACILITY_CREATED", "FACILITY",
                String.valueOf(saved.getId()), "Created facility '" + saved.getLabel() + "' on floor " + floor.getFloorNumber(), "SUCCESS"
        );
        return toFacilityAdminResponse(saved);
    }

    public FacilityAdminResponse updateFacility(User admin, Long id, FacilityUpdateRequest req) {
        Facility fac = facilityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found: " + id));
        if (req.type() != null) fac.setType(req.type());
        if (req.label() != null && !req.label().isBlank()) fac.setLabel(req.label());

        Facility saved = facilityRepository.save(fac);
        auditLogService.record(
                admin.getEmail(), "ADMIN", "FACILITY_UPDATED", "FACILITY",
                String.valueOf(saved.getId()), "Updated facility '" + saved.getLabel() + "'", "SUCCESS"
        );
        return toFacilityAdminResponse(saved);
    }

    public void deleteFacility(User admin, Long id) {
        Facility fac = facilityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found: " + id));
        facilityRepository.delete(fac);
        auditLogService.record(
                admin.getEmail(), "ADMIN", "FACILITY_DELETED", "FACILITY",
                String.valueOf(id), "Deleted facility #" + id, "SUCCESS"
        );
    }

    @Transactional(readOnly = true)
    public List<RetailerUserResponse> listRetailers() {
        Role retailerRole = roleRepository.findByName(RoleName.RETAILER).orElse(null);
        if (retailerRole == null) return List.of();

        List<User> retailers = userRepository.findAll().stream()
                .filter(u -> u.hasRole(RoleName.RETAILER))
                .toList();

        List<Shop> allShops = shopRepository.findAll();

        return retailers.stream().map(r -> {
            Shop assigned = allShops.stream()
                    .filter(s -> s.getOwner() != null && s.getOwner().getId().equals(r.getId()))
                    .findFirst()
                    .orElse(null);
            return new RetailerUserResponse(
                    r.getId(),
                    r.getEmail(),
                    r.getFullName(),
                    r.isEnabled(),
                    r.getCreatedAt(),
                    assigned != null ? assigned.getId() : null,
                    assigned != null ? assigned.getName() : "None Assigned",
                    assigned != null ? assigned.getFloor().getFloorNumber() : null
            );
        }).toList();
    }

    public RetailerUserResponse onboardRetailer(User admin, RetailerOnboardRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("An account with email " + req.email() + " already exists.");
        }

        Role retailerRole = roleRepository.findByName(RoleName.RETAILER)
                .orElseThrow(() -> new IllegalStateException("ROLE_RETAILER not found"));

        User user = User.builder()
                .email(req.email())
                .fullName(req.fullName())
                .passwordHash(passwordEncoder.encode(req.password()))
                .roles(Set.of(retailerRole))
                .enabled(true)
                .build();
        User savedUser = userRepository.save(user);

        Shop assignedShop = null;
        if (req.shopId() != null) {
            Shop shop = shopRepository.findById(req.shopId())
                    .orElseThrow(() -> new ShopNotFoundException(req.shopId()));
            shop.setOwner(savedUser);
            assignedShop = shopRepository.save(shop);
        }

        auditLogService.record(
                admin.getEmail(), "ADMIN", "RETAILER_CREATED", "USER",
                String.valueOf(savedUser.getId()),
                "Created retailer " + savedUser.getEmail() + " (" + savedUser.getFullName() + ")" +
                        (assignedShop != null ? ", assigned to '" + assignedShop.getName() + "'" : ""),
                "SUCCESS"
        );

        return new RetailerUserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.isEnabled(),
                savedUser.getCreatedAt(),
                assignedShop != null ? assignedShop.getId() : null,
                assignedShop != null ? assignedShop.getName() : "None Assigned",
                assignedShop != null ? assignedShop.getFloor().getFloorNumber() : null
        );
    }

    public RetailerUserResponse assignRetailerShop(User admin, Long retailerUserId, Long shopId) {
        User retailer = userRepository.findById(retailerUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + retailerUserId));

        if (!retailer.hasRole(RoleName.RETAILER)) {
            throw new IllegalArgumentException("User is not a designated retailer account.");
        }

        // Dissociate any previous shops owned by this user
        List<Shop> oldShops = shopRepository.findByOwnerId(retailer.getId());
        for (Shop os : oldShops) {
            os.setOwner(null);
            shopRepository.save(os);
        }

        Shop assigned = null;
        if (shopId != null) {
            assigned = shopRepository.findById(shopId)
                    .orElseThrow(() -> new ShopNotFoundException(shopId));
            assigned.setOwner(retailer);
            assigned = shopRepository.save(assigned);
        }

        auditLogService.record(
                admin.getEmail(), "ADMIN", "RETAILER_STORE_ASSIGNED", "USER",
                String.valueOf(retailer.getId()),
                "Assigned retailer " + retailer.getEmail() + " to store: " + (assigned != null ? assigned.getName() : "None"),
                "SUCCESS"
        );

        return new RetailerUserResponse(
                retailer.getId(),
                retailer.getEmail(),
                retailer.getFullName(),
                retailer.isEnabled(),
                retailer.getCreatedAt(),
                assigned != null ? assigned.getId() : null,
                assigned != null ? assigned.getName() : "None Assigned",
                assigned != null ? assigned.getFloor().getFloorNumber() : null
        );
    }

    public RetailerUserResponse toggleRetailerStatus(User admin, Long retailerUserId, boolean enabled) {
        User retailer = userRepository.findById(retailerUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + retailerUserId));

        retailer.setEnabled(enabled);
        User saved = userRepository.save(retailer);

        Shop assigned = shopRepository.findByOwnerId(retailer.getId()).stream().findFirst().orElse(null);

        auditLogService.record(
                admin.getEmail(), "ADMIN", "RETAILER_STATUS_CHANGED", "USER",
                String.valueOf(retailer.getId()),
                "Set enabled=" + enabled + " for retailer " + retailer.getEmail(),
                "SUCCESS"
        );

        return new RetailerUserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getFullName(),
                saved.isEnabled(),
                saved.getCreatedAt(),
                assigned != null ? assigned.getId() : null,
                assigned != null ? assigned.getName() : "None Assigned",
                assigned != null ? assigned.getFloor().getFloorNumber() : null
        );
    }

    private ShopAdminResponse toShopAdminResponse(Shop s) {
        long pCount = productRepository.findByShopId(s.getId()).size();
        return new ShopAdminResponse(
                s.getId(),
                s.getName(),
                s.getCategory(),
                s.getDescription(),
                s.getLogoUrl(),
                s.getFloor().getFloorNumber(),
                s.getFloor().getLabel(),
                s.getNavigationNode().getId(),
                s.getNavigationNode().getX(),
                s.getNavigationNode().getY(),
                s.isActive(),
                s.getOpeningTime(),
                s.getClosingTime(),
                s.getOwner() != null ? s.getOwner().getId() : null,
                s.getOwner() != null ? s.getOwner().getFullName() : null,
                s.getOwner() != null ? s.getOwner().getEmail() : null,
                pCount
        );
    }

    private FacilityAdminResponse toFacilityAdminResponse(Facility fac) {
        return new FacilityAdminResponse(
                fac.getId(),
                fac.getFloor().getFloorNumber(),
                fac.getFloor().getLabel(),
                fac.getType(),
                fac.getLabel(),
                fac.getNavigationNode().getId(),
                fac.getNavigationNode().getX(),
                fac.getNavigationNode().getY()
        );
    }
}
