package com.minimalecommerce.identity.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100) String name,
        @Size(max = 20) String phone
) {
}
