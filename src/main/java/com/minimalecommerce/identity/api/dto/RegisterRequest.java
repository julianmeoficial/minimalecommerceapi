package com.minimalecommerce.identity.api.dto;

import com.minimalecommerce.identity.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        String phone,
        @NotNull UserRole role
) {
}
