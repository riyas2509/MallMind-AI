package com.mallmind.backend.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Mirrors the model-service's RecommendedProduct (POST /recommendations).
 * Only productId and score are trusted -- name/category/price in the
 * model-service's own response are a snapshot of its catalog.csv export,
 * not the live database, so RankedProductService re-fetches the real
 * product by id instead of using them (Part 10: the model-service returns
 * advisory signals, Java owns facts).
 */
public record MlRecommendation(
        @JsonProperty("product_id") long productId,
        double score) {
}
