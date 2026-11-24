package com.mallmind.backend.dto.order;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId, String productName, String shopName, BigDecimal unitPrice, int quantity, BigDecimal lineTotal) {
}
