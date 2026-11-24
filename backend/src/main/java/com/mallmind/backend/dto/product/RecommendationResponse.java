package com.mallmind.backend.dto.product;

import java.util.List;

/**
 * {@code source} is never hidden from the caller (Part 17: don't pretend a
 * fallback is the real model) -- "ml-content-based" when the model-service
 * answered, "baseline-filter" when it didn't and ProductRecommendationService
 * fell back to a transparent, non-ML ranking instead.
 */
public record RecommendationResponse(List<ProductResponse> products, String source) {
}
