package com.mallmind.backend.controller;

import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.dto.order.OrderResponse;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retailer/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'RETAILER')")
public class RetailerOrderController {

    private final OrderService orderService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> listRetailerOrders() {
        return ResponseEntity.ok(orderService.listRetailerOrders(currentUserService.getCurrentUser()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatusByRetailer(currentUserService.getCurrentUser(), id, status));
    }
}
