package com.mallmind.backend.dto.navigation;

import com.mallmind.backend.domain.enums.NavigationNodeType;

public record RouteStep(
        Long nodeId,
        int floorNumber,
        double x,
        double y,
        NavigationNodeType nodeType,
        String label,
        String instruction) {
}
