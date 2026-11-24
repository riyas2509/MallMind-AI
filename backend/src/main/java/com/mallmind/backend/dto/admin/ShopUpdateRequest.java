package com.mallmind.backend.dto.admin;

import java.time.LocalTime;

public record ShopUpdateRequest(
        String name,
        String category,
        String description,
        String logoUrl,
        LocalTime openingTime,
        LocalTime closingTime
) {}
