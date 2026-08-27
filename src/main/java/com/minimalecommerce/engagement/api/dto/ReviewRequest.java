package com.minimalecommerce.engagement.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReviewRequest(
        @NotNull UUID productId,
        @NotNull @Min(1) @Max(5) Integer rating,
        String comment
) {
}
