package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.*;
import com.mallmind.backend.domain.enums.FulfilmentType;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.domain.enums.PaymentMethod;
import com.mallmind.backend.domain.enums.PaymentStatus;
import com.mallmind.backend.dto.order.CheckoutRequest;
import com.mallmind.backend.dto.order.OrderItemResponse;
import com.mallmind.backend.dto.order.OrderResponse;
import com.mallmind.backend.repository.CartItemRepository;
import com.mallmind.backend.repository.OrderRepository;
import com.mallmind.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.util.List;

/**
 * Authoritative checkout and sandbox payment verification service.
 * Recalculates all totals server-side, validates inventory availability,
 * processes simulated payment intents, and decrements stock atomically.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CheckoutService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CartService cartService;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderResponse checkout(User user, CheckoutRequest request) {
        Cart cart = cartService.getOrCreateCart(user);
        List<CartItem> cartItems = cart.getItems();
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot check out an empty cart");
        }

        // 1. Stock & Availability Revalidation
        for (CartItem ci : cartItems) {
            Product product = ci.getProduct();
            if (!product.isAvailable()) {
                throw new IllegalArgumentException("Product '" + product.getName() + "' is no longer available");
            }
            if (product.getStockQuantity() < ci.getQuantity()) {
                throw new IllegalArgumentException(
                        "Not enough stock for '" + product.getName() + "' (requested " + ci.getQuantity()
                                + ", available " + product.getStockQuantity() + ")");
            }
        }

        // 2. Sandbox Payment Simulation Verification
        if (Boolean.TRUE.equals(request.simulatePaymentFailure())) {
            throw new IllegalArgumentException(
                    "Simulated Sandbox Payment Failed (Code: ERR_SANDBOX_CARD_DECLINED). No stock was deducted and order was not placed.");
        }

        PaymentMethod paymentMethod = request.paymentMethod() != null ? request.paymentMethod() : PaymentMethod.UPI_SANDBOX;

        // 3. Tax and Delivery Calculations
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            subtotal = subtotal.add(ci.getProduct().effectivePrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }

        // GST 18% calculation (for retail invoicing breakdown)
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryFee = request.fulfilmentType() == FulfilmentType.MALL_DELIVERY
                ? new BigDecimal("50.00")
                : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(deliveryFee); // Prices in mall catalog are inclusive of MRP taxes

        String txnRef = "SIM-TXN-" + System.currentTimeMillis() + "-" + (1000 + RANDOM.nextInt(9000));

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .fulfilmentType(request.fulfilmentType())
                .status(OrderStatus.PLACED)
                .subtotalAmount(subtotal)
                .taxAmount(taxAmount)
                .deliveryFee(deliveryFee)
                .totalAmount(total)
                .customerName(request.customerName() != null && !request.customerName().isBlank() ? request.customerName() : user.getFullName())
                .customerPhone(request.customerPhone() != null && !request.customerPhone().isBlank() ? request.customerPhone() : "9876543210")
                .deliveryAddress(request.deliveryAddress())
                .specialInstructions(request.specialInstructions())
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatus.PAID_SANDBOX)
                .transactionReference(txnRef)
                .build();

        for (CartItem ci : cartItems) {
            Product product = ci.getProduct();
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productNameSnapshot(product.getName())
                    .unitPriceSnapshot(product.effectivePrice())
                    .quantity(ci.getQuantity())
                    .shopNameSnapshot(product.getShop().getName())
                    .build();
            order.getItems().add(orderItem);

            // Sandbox stock decrement
            product.setStockQuantity(product.getStockQuantity() - ci.getQuantity());
            productRepository.save(product);
        }

        order = orderRepository.save(order);

        // Clear cart on successful order placement
        cartItemRepository.deleteByCart(cart);

        return toResponse(order);
    }

    private String generateOrderNumber() {
        return "MM-" + System.currentTimeMillis() + "-" + (100 + RANDOM.nextInt(900));
    }

    public OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> new OrderItemResponse(
                        i.getProduct().getId(), i.getProductNameSnapshot(), i.getShopNameSnapshot(),
                        i.getUnitPriceSnapshot(), i.getQuantity(), i.lineTotal()))
                .toList();
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getFulfilmentType(),
                order.getTotalAmount(),
                order.getSubtotalAmount(),
                order.getTaxAmount(),
                order.getDeliveryFee(),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getDeliveryAddress(),
                order.getSpecialInstructions(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getTransactionReference(),
                items,
                order.getCreatedAt());
    }
}
