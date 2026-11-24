package com.mallmind.backend.dto.retailer;

import java.util.Map;

/** Outward-facing shape for POST /api/retailer/products/classify-image --
 * plain camelCase, matching every other Java API response in this project.
 * See DemandForecastResponse's javadoc for why this isn't just the
 * model-service's ImageClassification mirror returned directly. */
public record ImageClassificationResponse(
        String category, double confidence, boolean lowConfidence, Map<String, Double> probabilities, String note) {
}
