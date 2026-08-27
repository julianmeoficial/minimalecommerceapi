package com.minimalecommerce.ordering.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddCartItemRequest(
        @NotNull UUID productId,
        @NotNull @Min(1) Integer quantity
) {
}
