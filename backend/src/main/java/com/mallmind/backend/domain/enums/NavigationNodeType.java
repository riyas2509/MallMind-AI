package com.mallmind.backend.domain.enums;

/**
 * What a point in the indoor navigation graph represents. SHOP and FACILITY
 * nodes are destinations; the rest are purely structural (corridor
 * intersections and vertical transition points) and exist only to let the
 * route-finding graph represent the mall's real walkable topology.
 */
public enum NavigationNodeType {
    SHOP_ENTRANCE,
    FACILITY,
    CORRIDOR_JUNCTION,
    ENTRANCE_EXIT,
    ESCALATOR,
    ELEVATOR,
    STAIRCASE
}
