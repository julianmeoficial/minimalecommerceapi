package com.minimalecommerce.promotions.api.dto;

import com.minimalecommerce.promotions.domain.CouponType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record CouponRequest(
        @NotBlank @Size(max = 50) String code,
        @NotNull CouponType type,
        @NotNull @DecimalMin("0.01") BigDecimal value,
        @Size(max = 500) String description,
        @NotNull Instant startsAt,
        @NotNull @Future Instant expiresAt,
        @NotNull @Min(1) Integer maxUses
) {
}
