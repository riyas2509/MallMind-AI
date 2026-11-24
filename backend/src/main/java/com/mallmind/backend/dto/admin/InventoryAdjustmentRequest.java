package com.mallmind.backend.dto.admin;

import com.mallmind.backend.domain.enums.InventoryAdjustmentReason;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InventoryAdjustmentRequest(
        @NotNull Long productId,
        @NotNull @Min(0) Integer newStock,
        @NotNull InventoryAdjustmentReason reason,
        String notes
) {}
