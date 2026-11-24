package com.mallmind.backend.controller;

import com.mallmind.backend.domain.entity.NavigationNode;
import com.mallmind.backend.dto.navigation.RouteRequest;
import com.mallmind.backend.dto.navigation.RouteResponse;
import com.mallmind.backend.exception.ShopNotFoundException;
import com.mallmind.backend.repository.NavigationNodeRepository;
import com.mallmind.backend.service.navigation.NavigationGraphService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/navigation")
@RequiredArgsConstructor
public class NavigationController {

    private final NavigationGraphService navigationGraphService;
    private final NavigationNodeRepository navigationNodeRepository;

    /** Core route-calculation endpoint (Part 10). Supports accessible-only routing. */
    @PostMapping("/route")
    public ResponseEntity<RouteResponse> findRoute(@Valid @RequestBody RouteRequest request) {
        boolean accessibleOnly = Boolean.TRUE.equals(request.accessibleOnly());
        return ResponseEntity.ok(navigationGraphService.findRoute(request.fromNodeId(), request.toNodeId(), accessibleOnly));
    }

    /** Administrative 5-floor digital twin graph validation & connectivity analysis (Phase 3). */
    @GetMapping("/validate-graph")
    public ResponseEntity<com.mallmind.backend.dto.navigation.GraphValidationReport> validateGraph() {
        return ResponseEntity.ok(navigationGraphService.validateGraph());
    }

    /** QR-code-based starting-location check-in (Part 4, Module 1). */
    @GetMapping("/checkin")
    public ResponseEntity<Map<String, Object>> checkIn(@RequestParam String qrCode) {
        NavigationNode node = navigationNodeRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new ShopNotFoundException("Unknown QR code: " + qrCode));
        return ResponseEntity.ok(Map.of(
                "nodeId", node.getId(),
                "floorNumber", node.getFloor().getFloorNumber(),
                "label", node.getLabel() != null ? node.getLabel() : node.getType().name()));
    }

    /** Admin-triggered graph reload after layout edits (Part 8, Mall layout management). */
    @PostMapping("/reload-graph")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reloadGraph() {
        navigationGraphService.reload();
        return ResponseEntity.noContent().build();
    }
}
