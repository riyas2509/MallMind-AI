package com.mallmind.backend.dto.admin;

public record FloorOverviewResponse(
        Long floorId,
        int floorNumber,
        String label,
        long storeCount,
        long facilityCount,
        double planWidth,
        double planHeight
) {}
