package com.mallmind.backend.dto.order;

import com.mallmind.backend.domain.enums.FulfilmentType;
import com.mallmind.backend.domain.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
        @NotNull FulfilmentType fulfilmentType,
        String customerName,
        String customerPhone,
        String deliveryAddress,
        String specialInstructions,
        PaymentMethod paymentMethod,
        Boolean simulatePaymentFailure) {
}
