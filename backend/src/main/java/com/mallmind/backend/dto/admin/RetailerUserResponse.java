package com.mallmind.backend.dto.admin;

import java.time.Instant;

public record RetailerUserResponse(
        Long id,
        String email,
        String fullName,
        boolean enabled,
        Instant createdAt,
        Long shopId,
        String shopName,
        Integer shopFloorNumber
) {}
