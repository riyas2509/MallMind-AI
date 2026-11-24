package com.mallmind.backend.dto.shop;

public record ShopResponse(
        Long id,
        String name,
        String category,
        String description,
        String logoUrl,
        int floorNumber,
        Long navigationNodeId,
        double x,
        double y) {
}
