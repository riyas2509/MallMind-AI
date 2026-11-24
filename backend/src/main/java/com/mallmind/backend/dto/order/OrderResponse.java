package com.mallmind.backend.dto.order;

import com.mallmind.backend.domain.enums.FulfilmentType;
import com.mallmind.backend.domain.enums.OrderStatus;
import com.mallmind.backend.domain.enums.PaymentMethod;
import com.mallmind.backend.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        OrderStatus status,
        FulfilmentType fulfilmentType,
        BigDecimal totalAmount,
        BigDecimal subtotalAmount,
        BigDecimal taxAmount,
        BigDecimal deliveryFee,
        String customerName,
        String customerPhone,
        String deliveryAddress,
        String specialInstructions,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        String transactionReference,
        List<OrderItemResponse> items,
        Instant createdAt) {
}
