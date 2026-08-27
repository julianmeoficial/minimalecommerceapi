package com.minimalecommerce.ordering.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record PreorderRequest(
        @NotNull UUID productId,
        @NotNull @Min(1) Integer quantity,
        @Size(max = 500) String notes,
        Instant estimatedDelivery
) {
}
