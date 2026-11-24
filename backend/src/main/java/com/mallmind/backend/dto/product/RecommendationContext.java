package com.mallmind.backend.dto.product;

import java.math.BigDecimal;

/** TContext for RecommendationProvider&lt;RecommendationContext, ProductResponse&gt;. */
public record RecommendationContext(String category, String brand, String color, BigDecimal maxBudget) {
}
