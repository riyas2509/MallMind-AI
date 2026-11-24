package com.mallmind.backend.dto.retailer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ProductCreateRequest(
        @NotNull Long shopId,
        @NotBlank String categoryName,
        @NotBlank String name,
        String brand,
        String color,
        String description,
        @NotNull @Positive BigDecimal price,
        BigDecimal discountPrice,
        String specifications,
        String imageUrl,
        boolean available,
        int stockQuantity) {
}
