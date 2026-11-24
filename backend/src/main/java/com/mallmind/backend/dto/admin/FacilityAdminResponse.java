package com.mallmind.backend.dto.admin;

import com.mallmind.backend.domain.enums.FacilityType;

public record FacilityAdminResponse(
        Long id,
        int floorNumber,
        String floorLabel,
        FacilityType type,
        String label,
        Long navigationNodeId,
        double x,
        double y
) {}
