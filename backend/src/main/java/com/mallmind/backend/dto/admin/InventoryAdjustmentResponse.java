package com.mallmind.backend.dto.admin;

import com.mallmind.backend.domain.enums.InventoryAdjustmentReason;
import java.time.Instant;

public record InventoryAdjustmentResponse(
        Long id,
        Long productId,
        String productName,
        Long shopId,
        String shopName,
        int oldStock,
        int newStock,
        int changeQuantity,
        InventoryAdjustmentReason reason,
        String actorEmail,
        String actorRole,
        String notes,
        Instant createdAt
) {}
