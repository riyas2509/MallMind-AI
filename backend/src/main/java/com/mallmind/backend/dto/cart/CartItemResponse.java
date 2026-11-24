package com.mallmind.backend.dto.cart;

import com.mallmind.backend.dto.product.ProductResponse;

import java.math.BigDecimal;

public record CartItemResponse(Long cartItemId, ProductResponse product, int quantity, BigDecimal lineTotal) {
}
