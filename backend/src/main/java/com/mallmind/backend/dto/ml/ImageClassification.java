package com.mallmind.backend.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/** Mirrors the model-service's ImageClassificationResponse (POST
 * /vision/classify). Advisory only -- a retailer still picks the final
 * category; `category` is already null when low_confidence is true, so a
 * caller that blindly trusted it would get no suggestion rather than a bad
 * guess. */
public record ImageClassification(
        String category,
        double confidence,
        @JsonProperty("low_confidence") boolean lowConfidence,
        Map<String, Double> probabilities,
        String note) {
}
