package com.mallmind.backend.controller;

import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.dto.admin.InventoryAdjustmentRequest;
import com.mallmind.backend.dto.admin.InventoryAdjustmentResponse;
import com.mallmind.backend.dto.admin.InventoryAlertResponse;
import com.mallmind.backend.repository.ShopRepository;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/retailer/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'RETAILER')")
public class RetailerInventoryController {

    private final InventoryService inventoryService;
    private final ShopRepository shopRepository;
    private final CurrentUserService currentUserService;

    @GetMapping("/alerts")
    public ResponseEntity<List<InventoryAlertResponse>> getMyStoreAlerts() {
        User user = currentUserService.getCurrentUser();
        List<Shop> shops = shopRepository.findByOwnerId(user.getId());
        List<InventoryAlertResponse> alerts = new ArrayList<>();
        for (Shop s : shops) {
            alerts.addAll(inventoryService.getInventoryAlerts(s.getId()));
        }
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryAdjustmentResponse> adjustMyStock(
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(inventoryService.adjustStock(user, request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<InventoryAdjustmentResponse>> getMyStoreHistory(
            @RequestParam(defaultValue = "50") int limit) {
        User user = currentUserService.getCurrentUser();
        List<Shop> shops = shopRepository.findByOwnerId(user.getId());
        List<InventoryAdjustmentResponse> history = new ArrayList<>();
        for (Shop s : shops) {
            history.addAll(inventoryService.getHistory(s.getId(), limit));
        }
        return ResponseEntity.ok(history);
    }
}
