package com.minimalecommerce.catalog.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 200) String description
) {
}
