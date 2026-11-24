package com.mallmind.backend.controller;

import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.dto.admin.*;
import com.mallmind.backend.dto.order.OrderResponse;
import com.mallmind.backend.dto.product.ProductResponse;
import com.mallmind.backend.repository.ProductRepository;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOperationsController {

    private final AdminMallService adminMallService;
    private final InventoryService inventoryService;
    private final AdminOrderService adminOrderService;
    private final AuditLogService auditLogService;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;

    // 1. Dashboard Overview
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminMallService.getDashboardStats());
    }

    // 2. Mall Structure: Floors
    @GetMapping("/floors")
    public ResponseEntity<List<FloorOverviewResponse>> listFloors() {
        return ResponseEntity.ok(adminMallService.listFloorsWithStats());
    }

    // 3. Mall Structure: Shops
    @GetMapping("/shops")
    public ResponseEntity<List<ShopAdminResponse>> listShops(
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(adminMallService.listShops(floor, category, active, query));
    }

    @GetMapping("/shops/{id}")
    public ResponseEntity<ShopAdminResponse> getShop(@PathVariable Long id) {
        return ResponseEntity.ok(adminMallService.getShop(id));
    }

    @PutMapping("/shops/{id}")
    public ResponseEntity<ShopAdminResponse> updateShopMetadata(
            @PathVariable Long id,
            @RequestBody ShopUpdateRequest request) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.updateShopMetadata(admin, id, request));
    }

    @PatchMapping("/shops/{id}/status")
    public ResponseEntity<ShopAdminResponse> toggleShopStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.toggleShopStatus(admin, id, active));
    }

    // 4. Mall Structure: Facilities
    @GetMapping("/facilities")
    public ResponseEntity<List<FacilityAdminResponse>> listFacilities(@RequestParam(required = false) Integer floor) {
        return ResponseEntity.ok(adminMallService.listFacilities(floor));
    }

    @PostMapping("/facilities")
    public ResponseEntity<FacilityAdminResponse> createFacility(@Valid @RequestBody FacilityCreateRequest request) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.createFacility(admin, request));
    }

    @PutMapping("/facilities/{id}")
    public ResponseEntity<FacilityAdminResponse> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody FacilityUpdateRequest request) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.updateFacility(admin, id, request));
    }

    @DeleteMapping("/facilities/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        User admin = currentUserService.getCurrentUser();
        adminMallService.deleteFacility(admin, id);
        return ResponseEntity.noContent().build();
    }

    // 5. Retailer Management
    @GetMapping("/retailers")
    public ResponseEntity<List<RetailerUserResponse>> listRetailers() {
        return ResponseEntity.ok(adminMallService.listRetailers());
    }

    @PostMapping("/retailers")
    public ResponseEntity<RetailerUserResponse> onboardRetailer(@Valid @RequestBody RetailerOnboardRequest request) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.onboardRetailer(admin, request));
    }

    @PutMapping("/retailers/{userId}/shop")
    public ResponseEntity<RetailerUserResponse> assignRetailerShop(
            @PathVariable Long userId,
            @RequestParam(required = false) Long shopId) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.assignRetailerShop(admin, userId, shopId));
    }

    @PatchMapping("/retailers/{userId}/status")
    public ResponseEntity<RetailerUserResponse> toggleRetailerStatus(
            @PathVariable Long userId,
            @RequestParam boolean enabled) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminMallService.toggleRetailerStatus(admin, userId, enabled));
    }

    // 6. Products Administration (Mall-wide)
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> listMallProducts(
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String query) {
        List<Product> products = productRepository.findAll().stream()
                .filter(p -> shopId == null || p.getShop().getId().equals(shopId))
                .filter(p -> category == null || category.isBlank() || p.getCategory().getName().equalsIgnoreCase(category))
                .filter(p -> available == null || p.isAvailable() == available)
                .filter(p -> query == null || query.isBlank() || p.getName().toLowerCase().contains(query.toLowerCase()))
                .toList();
        List<ProductResponse> responses = products.stream()
                .map(p -> new ProductResponse(
                        p.getId(), p.getName(), p.getBrand(), p.getColor(), p.getCategory().getName(),
                        p.getPrice(), p.getDiscountPrice(), p.effectivePrice(), p.isAvailable(), p.getImageUrl(),
                        p.getShop().getId(), p.getShop().getName(), p.getShop().getFloor().getFloorNumber()))
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/products/{id}/status")
    public ResponseEntity<ProductResponse> toggleProductStatus(
            @PathVariable Long id,
            @RequestParam boolean available) {
        User admin = currentUserService.getCurrentUser();
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        p.setAvailable(available);
        Product saved = productRepository.save(p);
        auditLogService.record(
                admin.getEmail(), "ADMIN", "PRODUCT_STATUS_CHANGED", "PRODUCT",
                String.valueOf(p.getId()), "Product '" + p.getName() + "' available set to: " + available, "SUCCESS"
        );
        return ResponseEntity.ok(new ProductResponse(
                saved.getId(), saved.getName(), saved.getBrand(), saved.getColor(), saved.getCategory().getName(),
                saved.getPrice(), saved.getDiscountPrice(), saved.effectivePrice(), saved.isAvailable(), saved.getImageUrl(),
                saved.getShop().getId(), saved.getShop().getName(), saved.getShop().getFloor().getFloorNumber()));
    }

    // 7. Inventory Administration
    @GetMapping("/inventory/alerts")
    public ResponseEntity<List<InventoryAlertResponse>> getInventoryAlerts(
            @RequestParam(required = false) Long shopId) {
        return ResponseEntity.ok(inventoryService.getInventoryAlerts(shopId));
    }

    @PostMapping("/inventory/adjust")
    public ResponseEntity<InventoryAdjustmentResponse> adjustStock(
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(inventoryService.adjustStock(admin, request));
    }

    @GetMapping("/inventory/history")
    public ResponseEntity<List<InventoryAdjustmentResponse>> getInventoryHistory(
            @RequestParam(required = false) Long shopId,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(inventoryService.getHistory(shopId, limit));
    }

    // 8. Order Oversight
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> listMallOrders(
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean delayedOnly) {
        return ResponseEntity.ok(adminOrderService.listMallOrders(shopId, status, query, delayedOnly));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatusAdmin(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            @RequestParam(required = false) String notes) {
        User admin = currentUserService.getCurrentUser();
        return ResponseEntity.ok(adminOrderService.updateOrderStatusAdmin(admin, id, status, notes));
    }

    // 9. Audit Logging
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> listAuditLogs(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditLogService.listLogs(actionType, entityType, page, size));
    }
}
