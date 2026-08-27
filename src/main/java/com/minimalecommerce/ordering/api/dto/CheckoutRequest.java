package com.minimalecommerce.ordering.api.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CheckoutRequest(
        UUID addressId,
        @Size(max = 500) String shippingAddress,
        @Size(max = 50) String couponCode
) {
}
