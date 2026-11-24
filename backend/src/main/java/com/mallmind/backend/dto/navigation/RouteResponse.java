package com.mallmind.backend.dto.navigation;

import java.util.List;

public record RouteResponse(
        Long fromNodeId,
        Long toNodeId,
        double totalDistance,
        List<RouteStep> steps,
        List<String> spokenDirections,
        Double estimatedDistanceMeters,
        Boolean isEstimatedDistance,
        Double rawCanvasDistance,
        Integer floorTransitionsCount,
        List<Integer> floorSequence,
        String routeType) {

    // 5-arg constructor maintaining binary & source compatibility for tests and legacy callers
    public RouteResponse(
            Long fromNodeId,
            Long toNodeId,
            double totalDistance,
            List<RouteStep> steps,
            List<String> spokenDirections) {
        this(
                fromNodeId,
                toNodeId,
                totalDistance,
                steps,
                spokenDirections,
                Math.round(totalDistance * 0.25 * 10.0) / 10.0,
                true,
                totalDistance,
                0,
                List.of(),
                "SAME_FLOOR");
    }

    public double totalDistanceMeters() {
        return estimatedDistanceMeters != null ? estimatedDistanceMeters : Math.round(totalDistance * 0.25 * 10.0) / 10.0;
    }
}
