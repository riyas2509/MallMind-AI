package com.mallmind.backend.dto.navigation;

import jakarta.validation.constraints.NotNull;

public record RouteRequest(
        @NotNull Long fromNodeId,
        @NotNull Long toNodeId,
        Boolean accessibleOnly) {

    public RouteRequest(@NotNull Long fromNodeId, @NotNull Long toNodeId) {
        this(fromNodeId, toNodeId, false);
    }
}
