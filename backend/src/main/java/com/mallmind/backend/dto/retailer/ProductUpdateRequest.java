package com.mallmind.backend.dto.retailer;

import java.math.BigDecimal;

/** Every field is nullable/optional -- a retailer updates only what changed
 * (e.g. just the price, or just availability) rather than resending the
 * whole product (Part 8: "Update price. Update availability."). */
public record ProductUpdateRequest(
        String name,
        String brand,
        String color,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        String specifications,
        String imageUrl,
        Boolean available,
        Integer stockQuantity) {
}
