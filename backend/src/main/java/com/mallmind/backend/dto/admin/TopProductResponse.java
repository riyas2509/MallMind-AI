package com.mallmind.backend.dto.admin;

import java.math.BigDecimal;

public record TopProductResponse(String productName, String shopName, long totalQuantity, BigDecimal totalRevenue) {
}
