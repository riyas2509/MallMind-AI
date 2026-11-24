package com.mallmind.backend.dto.product;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String brand,
        String color,
        String category,
        BigDecimal price,
        BigDecimal discountPrice,
        BigDecimal effectivePrice,
        boolean available,
        String imageUrl,
        Long shopId,
        String shopName,
        int shopFloorNumber) {
}
