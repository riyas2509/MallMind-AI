package com.mallmind.backend.domain.contract;

import com.mallmind.backend.dto.navigation.RouteResponse;

/** OOP interface requirement (Part 6): anything capable of computing an
 * indoor route between two navigation graph nodes. */
public interface Navigable {
    RouteResponse findRoute(Long fromNodeId, Long toNodeId);

    default RouteResponse findRoute(Long fromNodeId, Long toNodeId, boolean accessibleOnly) {
        return findRoute(fromNodeId, toNodeId);
    }
}
