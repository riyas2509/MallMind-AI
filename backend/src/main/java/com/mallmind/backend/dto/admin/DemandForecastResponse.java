package com.mallmind.backend.dto.admin;

/** Outward-facing shape for GET /api/admin/analytics/demand/{category}/predict
 * -- plain camelCase, matching every other Java API response in this
 * project. Deliberately NOT the same class as ModelServiceClient's internal
 * DemandPrediction mirror: that one carries @JsonProperty("predicted_next_day_count")
 * for deserializing the model-service's snake_case response, and Jackson
 * annotations are bidirectional by default -- returning that DTO directly
 * from a controller would leak the Python wire format (snake_case) to API
 * consumers instead of this codebase's camelCase convention. */
public record DemandForecastResponse(String category, double predictedNextDayCount, String basis) {
}
