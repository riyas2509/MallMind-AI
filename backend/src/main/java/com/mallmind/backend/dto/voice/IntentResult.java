package com.mallmind.backend.dto.voice;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/** Mirrors the model-service's IntentResponse (model-service/app/main.py,
 * POST /nlu/intent). */
public record IntentResult(
        String intent,
        double confidence,
        @JsonProperty("low_confidence") boolean lowConfidence,
        Map<String, Double> probabilities,
        NluEntities entities) {
}
