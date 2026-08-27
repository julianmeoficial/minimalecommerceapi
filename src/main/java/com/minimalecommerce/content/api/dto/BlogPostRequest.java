package com.minimalecommerce.content.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record BlogPostRequest(
        @NotBlank @Size(max = 250) String title,
        @Size(max = 500) String summary,
        String body,
        UUID categoryId,
        String imageUrl
) {
}
