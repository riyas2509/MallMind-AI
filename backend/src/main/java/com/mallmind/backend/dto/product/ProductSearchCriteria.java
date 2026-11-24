package com.mallmind.backend.dto.product;

import java.math.BigDecimal;

public record ProductSearchCriteria(
        String name,
        String brand,
        String category,
        String color,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Long shopId,
        Boolean available,
        String sortBy) {

    public ProductSearchCriteria(
            String name,
            String brand,
            String category,
            String color,
            BigDecimal minPrice,
            BigDecimal maxPrice) {
        this(name, brand, category, color, minPrice, maxPrice, null, null, null);
    }
}
