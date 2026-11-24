package com.mallmind.backend.service;

import com.mallmind.backend.domain.contract.Searchable;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.dto.shop.ShopResponse;
import com.mallmind.backend.dto.shop.ShopSearchCriteria;
import com.mallmind.backend.exception.ShopNotFoundException;
import com.mallmind.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopService implements Searchable<ShopSearchCriteria, ShopResponse> {

    private final ShopRepository shopRepository;
    private final AnalyticsLogService analyticsLogService;

    @Override
    public List<ShopResponse> search(ShopSearchCriteria criteria) {
        List<Shop> matches;
        if (criteria.floorNumber() != null) {
            matches = shopRepository.findByActiveTrue().stream()
                    .filter(s -> s.getFloor().getFloorNumber() == criteria.floorNumber())
                    .toList();
        } else if (criteria.category() != null && !criteria.category().isBlank()) {
            matches = shopRepository.findByCategoryContainingIgnoreCaseAndActiveTrue(criteria.category());
        } else if (criteria.name() != null && !criteria.name().isBlank()) {
            matches = shopRepository.findByNameContainingIgnoreCaseAndActiveTrue(criteria.name());
        } else {
            matches = shopRepository.findByActiveTrue();
        }

        List<ShopResponse> results = matches.stream().map(this::toResponse).toList();

        String term = criteria.name() != null ? criteria.name() : criteria.category();
        analyticsLogService.logSearch("SHOP_SEARCH", term, criteria.category(), results.size());

        return results;
    }

    public ShopResponse getById(Long id) {
        Shop shop = shopRepository.findById(id).orElseThrow(() -> new ShopNotFoundException(id));
        return toResponse(shop);
    }

    private ShopResponse toResponse(Shop shop) {
        return new ShopResponse(
                shop.getId(),
                shop.getName(),
                shop.getCategory(),
                shop.getDescription(),
                shop.getLogoUrl(),
                shop.getFloor().getFloorNumber(),
                shop.getNavigationNode().getId(),
                shop.getNavigationNode().getX(),
                shop.getNavigationNode().getY());
    }
}
