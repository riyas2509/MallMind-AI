package com.mallmind.backend.exception;

/** Thrown by NavigationGraphService when no path exists between two nodes
 * in the navigation graph (e.g. a disconnected floor, or bad seed data). */
public class RouteNotFoundException extends RuntimeException {
    public RouteNotFoundException(Long fromNodeId, Long toNodeId) {
        super("No walkable route exists between node " + fromNodeId + " and node " + toNodeId);
    }
}
