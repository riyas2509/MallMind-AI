package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Offer;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.RoleName;
import com.mallmind.backend.dto.offer.OfferRequest;
import com.mallmind.backend.dto.offer.OfferResponse;
import com.mallmind.backend.exception.ShopNotFoundException;
import com.mallmind.backend.exception.ShopOwnershipException;
import com.mallmind.backend.repository.OfferRepository;
import com.mallmind.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OfferService {

    private final OfferRepository offerRepository;
    private final ShopRepository shopRepository;

    /** Public listing for visitors -- only active offers, sponsored ones carry their disclosure flag (Part 12). */
    public List<OfferResponse> listActiveOffers() {
        return offerRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public OfferResponse createOffer(User currentUser, OfferRequest request) {
        Shop shop = shopRepository.findById(request.shopId())
                .orElseThrow(() -> new ShopNotFoundException(request.shopId()));
        assertOwnsShop(currentUser, shop);

        Offer offer = Offer.builder()
                .shop(shop)
                .title(request.title())
                .description(request.description())
                .validFrom(request.validFrom())
                .validTo(request.validTo())
                .sponsored(request.sponsored())
                .active(true)
                .build();

        return toResponse(offerRepository.save(offer));
    }

    public void deactivateOffer(User currentUser, Long offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("No offer with id " + offerId));
        assertOwnsShop(currentUser, offer.getShop());
        offer.setActive(false);
        offerRepository.save(offer);
    }

    private void assertOwnsShop(User currentUser, Shop shop) {
        if (currentUser.hasRole(RoleName.ADMIN)) {
            return;
        }
        if (shop.getOwner() == null || !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new ShopOwnershipException("You do not manage shop '" + shop.getName() + "'");
        }
    }

    private OfferResponse toResponse(Offer o) {
        return new OfferResponse(
                o.getId(), o.getShop().getId(), o.getShop().getName(), o.getTitle(), o.getDescription(),
                o.getValidFrom(), o.getValidTo(), o.isActive(), o.isSponsored());
    }
}
