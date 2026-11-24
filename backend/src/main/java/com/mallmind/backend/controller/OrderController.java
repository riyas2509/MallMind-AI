package com.mallmind.backend.controller;

import com.mallmind.backend.dto.order.CheckoutRequest;
import com.mallmind.backend.dto.order.OrderResponse;
import com.mallmind.backend.security.CurrentUserService;
import com.mallmind.backend.service.CheckoutService;
import com.mallmind.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class OrderController {

    private final CheckoutService checkoutService;
    private final OrderService orderService;
    private final CurrentUserService currentUserService;

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(checkoutService.checkout(currentUserService.getCurrentUser(), request));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> listOrders() {
        return ResponseEntity.ok(orderService.listOrders(currentUserService.getCurrentUser()));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(currentUserService.getCurrentUser(), id));
    }
}
