package com.mallmind.backend.dto.admin;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardStatsResponse(
        long totalStores,
        long activeStores,
        long inactiveStores,
        int totalFloors,
        long totalFacilities,
        long totalProducts,
        long activeRetailers,
        long totalUsers,
        long totalOrders,
        BigDecimal totalRevenue,
        Map<String, Long> ordersByStatus,
        Map<String, Long> categoryBreakdown,
        long lowStockCount,
        long outOfStockCount,
        String countsSource,
        boolean isDemoData
) {}
