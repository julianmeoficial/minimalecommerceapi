package com.minimalecommerce.content.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record EventRequest(
        @NotBlank @Size(max = 200) String title,
        String description,
        @NotNull Instant startsAt,
        Instant endsAt,
        @Size(max = 300) String location,
        String imageUrl
) {
}
