package com.mallmind.backend.dto.offer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record OfferRequest(
        @NotNull Long shopId,
        @NotBlank String title,
        String description,
        LocalDate validFrom,
        LocalDate validTo,
        boolean sponsored) {
}
