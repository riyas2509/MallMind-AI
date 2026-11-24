package com.mallmind.backend.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Mirrors the model-service's DemandPredictionResponse (GET
 * /demand/{category}/predict). `basis` carries the model-service's own
 * honest caveat text (trained on simulated data) -- never stripped. */
public record DemandPrediction(
        String category,
        @JsonProperty("predicted_next_day_count") double predictedNextDayCount,
        String basis) {
}
