package com.mallmind.backend.dto.admin;

import java.math.BigDecimal;

/** Part 8 admin dashboard top-level counters. Every number is a real
 * aggregate over real tables -- nothing here is a placeholder. */
public record AnalyticsSummaryResponse(
        long totalProducts,
        long totalShops,
        long totalOrders,
        BigDecimal totalRevenue,
        long totalSearches,
        double productSearchZeroResultRate,
        double shopSearchZeroResultRate) {
}
