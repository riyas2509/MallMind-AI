package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.Order;
import com.mallmind.backend.domain.entity.OrderItem;
import com.mallmind.backend.domain.entity.Product;
import com.mallmind.backend.domain.entity.Shop;
import com.mallmind.backend.domain.entity.User;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.domain.enums.PaymentStatus;
import com.mallmind.backend.domain.enums.RoleName;
import com.mallmind.backend.dto.order.OrderResponse;
import com.mallmind.backend.exception.OrderNotFoundException;
import com.mallmind.backend.exception.ShopOwnershipException;
import com.mallmind.backend.repository.OrderRepository;
import com.mallmind.backend.repository.ProductRepository;
import com.mallmind.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final CheckoutService checkoutService;

    @Transactional(readOnly = true)
    public List<OrderResponse> listOrders(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(checkoutService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(User user, Long orderId) {
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        return checkoutService.toResponse(order);
    }

    /**
     * Customer cancellation with atomic inventory restoration and simulated refund.
     */
    public OrderResponse cancelOrder(User user, Long orderId) {
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Only orders in PLACED status can be cancelled. Current status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUNDED_SANDBOX);

        // Atomically restore product stock
        for (OrderItem item : order.getItems()) {
            Product p = item.getProduct();
            p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
            productRepository.save(p);
        }

        return checkoutService.toResponse(orderRepository.save(order));
    }

    /**
     * Retailer & Admin order visibility:
     * ADMIN sees all orders; RETAILER sees only orders containing items from their owned shops.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> listRetailerOrders(User currentUser) {
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMIN);
        List<Order> orders;
        if (isAdmin) {
            orders = orderRepository.findAll();
        } else {
            List<Long> shopIds = shopRepository.findByOwnerId(currentUser.getId()).stream().map(Shop::getId).toList();
            if (shopIds.isEmpty()) return List.of();
            orders = orderRepository.findByShopIdIn(shopIds);
        }
        return orders.stream().map(checkoutService::toResponse).toList();
    }

    /**
     * Retailer & Admin status update (e.g. PLACED -> READY_FOR_PICKUP -> COMPLETED).
     * If cancelled, also restores inventory.
     */
    public OrderResponse updateOrderStatusByRetailer(User currentUser, Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMIN);
        if (!isAdmin) {
            List<Long> ownedShopIds = shopRepository.findByOwnerId(currentUser.getId()).stream().map(Shop::getId).toList();
            boolean hasShopItem = order.getItems().stream().anyMatch(i -> ownedShopIds.contains(i.getProduct().getShop().getId()));
            if (!hasShopItem) {
                throw new ShopOwnershipException("You do not own any shop items in order #" + orderId);
            }
        }

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

        return checkoutService.toResponse(orderRepository.save(order));
    }
}
