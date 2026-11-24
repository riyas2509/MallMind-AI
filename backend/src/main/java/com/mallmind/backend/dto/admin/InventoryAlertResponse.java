package com.mallmind.backend.dto.admin;

import java.math.BigDecimal;

public record InventoryAlertResponse(
        Long productId,
        String productName,
        String brand,
        String category,
        Long shopId,
        String shopName,
        int floorNumber,
        BigDecimal price,
        int stockQuantity,
        boolean available,
        String alertType // "OUT_OF_STOCK" or "LOW_STOCK"
) {}
