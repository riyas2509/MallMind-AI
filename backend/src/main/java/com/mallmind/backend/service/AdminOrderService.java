package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Order;
import com.mallmind.backend.domain.entity.OrderItem;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.domain.enums.PaymentStatus;
import com.mallmind.backend.dto.order.OrderResponse;
import com.mallmind.backend.exception.OrderNotFoundException;
import com.mallmind.backend.repository.OrderRepository;
import com.mallmind.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CheckoutService checkoutService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<OrderResponse> listMallOrders(Long shopId, OrderStatus status, String query, Boolean delayedOnly) {
        Instant twoHoursAgo = Instant.now().minus(Duration.ofHours(2));

        return orderRepository.findAll().stream()
                .filter(o -> status == null || o.getStatus() == status)
                .filter(o -> shopId == null || o.getItems().stream().anyMatch(i -> i.getProduct().getShop().getId().equals(shopId)))
                .filter(o -> query == null || query.isBlank() ||
                        o.getOrderNumber().toLowerCase().contains(query.toLowerCase()) ||
                        (o.getCustomerName() != null && o.getCustomerName().toLowerCase().contains(query.toLowerCase())))
                .filter(o -> {
                    if (Boolean.TRUE.equals(delayedOnly)) {
                        return o.getStatus() == OrderStatus.PLACED && o.getCreatedAt().isBefore(twoHoursAgo);
                    }
                    return true;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(checkoutService::toResponse)
                .toList();
    }

    public OrderResponse updateOrderStatusAdmin(User admin, Long orderId, OrderStatus newStatus, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED) {
            order.setPaymentStatus(PaymentStatus.REFUNDED_SANDBOX);
            for (OrderItem item : order.getItems()) {
                Product p = item.getProduct();
                p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                productRepository.save(p);
            }
        }

        Order saved = orderRepository.save(order);

        auditLogService.record(
                admin.getEmail(), "ADMIN", "ORDER_STATUS_UPDATED", "ORDER",
                String.valueOf(order.getId()),
                "Admin changed order #" + order.getOrderNumber() + " status from " + oldStatus + " to " + newStatus +
                        (notes != null ? " (Notes: " + notes + ")" : ""),
                "SUCCESS"
        );

        return checkoutService.toResponse(saved);
    }
}
