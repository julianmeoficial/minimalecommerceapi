package com.minimalecommerce.identity.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank @Size(max = 100) String label,
        @NotBlank @Size(max = 400) String fullAddress,
        @Size(max = 100) String city,
        @Size(max = 20) String postalCode,
        @Size(max = 20) String phone,
        boolean primaryAddress
) {
}
