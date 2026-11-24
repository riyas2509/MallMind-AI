package com.mallmind.backend.dto.offer;

import java.time.LocalDate;

public record OfferResponse(
        Long id,
        Long shopId,
        String shopName,
        String title,
        String description,
        LocalDate validFrom,
        LocalDate validTo,
        boolean active,
        boolean sponsored) {
}
