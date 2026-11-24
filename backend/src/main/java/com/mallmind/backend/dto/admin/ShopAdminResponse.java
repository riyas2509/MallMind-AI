package com.mallmind.backend.dto.admin;

import java.time.LocalTime;

public record ShopAdminResponse(
        Long id,
        String name,
        String category,
        String description,
        String logoUrl,
        int floorNumber,
        String floorLabel,
        Long navigationNodeId,
        double x,
        double y,
        boolean active,
        LocalTime openingTime,
        LocalTime closingTime,
        Long ownerUserId,
        String ownerName,
        String ownerEmail,
        long productCount
) {}
