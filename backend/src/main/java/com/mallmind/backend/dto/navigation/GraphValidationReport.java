package com.mallmind.backend.dto.navigation;

import java.util.List;
import java.util.Map;

/**
 * Administrative verification and integrity report for the 5-floor digital twin navigation graph.
 * Assesses topology, connectivity, vertical transitions, and physical scale factor.
 */
public record GraphValidationReport(
        int totalNodes,
        int totalEdges,
        int totalFloors,
        int connectedComponentsCount,
        boolean isFullyConnected,
        List<Long> unreachableFromEntranceNodes,
        List<String> verifiedShopsReachable,
        List<String> unverifiedOrMissingShops,
        List<String> verifiedFacilitiesReachable,
        double estimatedScaleFactorMetersPerUnit,
        boolean scaleFactorIsEstimated,
        String architecturalSourceLabel,
        String status,
        Map<String, Integer> nodesByFloor
) {
}
