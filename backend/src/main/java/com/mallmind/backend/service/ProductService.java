package com.mallmind.backend.service;

import com.mallmind.backend.domain.contract.Searchable;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.dto.product.ProductSearchCriteria;
import com.mallmind.backend.exception.ProductNotFoundException;
import com.mallmind.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Budget-aware, brand-locked, and inventory-authoritative catalogue search service.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService implements Searchable<ProductSearchCriteria, ProductResponse> {

    private final ProductRepository productRepository;
    private final AnalyticsLogService analyticsLogService;

    @Override
    public List<ProductResponse> search(ProductSearchCriteria criteria) {
        String name = blankToNull(criteria.name());
        String brand = blankToNull(criteria.brand());
        List<Product> matches = productRepository.search(
                name == null ? null : "%" + name + "%",
                brand == null ? null : "%" + brand + "%",
                blankToNull(criteria.category()),
                blankToNull(criteria.color()),
                criteria.minPrice(),
                criteria.maxPrice(),
                criteria.shopId(),
                criteria.available());

        List<Product> sorted = new ArrayList<>(matches);
        if (criteria.sortBy() != null) {
            String sort = criteria.sortBy().toLowerCase();
            if (sort.contains("desc") || sort.equals("price_desc")) {
                sorted.sort(Comparator.comparing(Product::effectivePrice).reversed());
            } else if (sort.contains("asc") || sort.equals("price_asc")) {
                sorted.sort(Comparator.comparing(Product::effectivePrice));
            }
        }

        List<ProductResponse> results = sorted.stream().map(this::toResponse).toList();

        String term = criteria.name() != null ? criteria.name() : criteria.category();
        analyticsLogService.logSearch("PRODUCT_SEARCH", term, criteria.category(), results.size());

        return results;
    }

    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
        return toResponse(product);
    }

    public List<ProductResponse> getByShopId(Long shopId) {
        return productRepository.findByShopId(shopId).stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> compare(List<Long> productIds) {
        return productRepository.findAllById(productIds).stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> similarTo(Long productId) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ProductNotFoundException(productId));
        return productRepository.findByCategoryIdAndAvailableTrue(product.getCategory().getId()).stream()
                .filter(p -> !p.getId().equals(productId))
                .map(this::toResponse)
                .toList();
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.toLowerCase();
    }

    ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getBrand(),
                p.getColor(),
                p.getCategory().getName(),
                p.getPrice(),
                p.getDiscountPrice(),
                p.effectivePrice(),
                p.isAvailable(),
                p.getImageUrl(),
                p.getShop().getId(),
                p.getShop().getName(),
                p.getShop().getFloor().getFloorNumber());
    }
}
