package com.mallmind.backend.dto.voice;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Mirrors the model-service's EntityBag (model-service/app/main.py). */
public record NluEntities(
        @JsonProperty("max_budget") Double maxBudget,
        String category,
        String brand,
        String color,
        String shop,
        String facility,
        String destination) {
}
