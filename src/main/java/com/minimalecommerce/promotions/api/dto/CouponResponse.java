package com.minimalecommerce.promotions.api.dto;

import com.minimalecommerce.promotions.domain.Coupon;
import com.minimalecommerce.promotions.domain.CouponType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CouponResponse(
        UUID id,
        String code,
        CouponType type,
        BigDecimal value,
        String description,
        Instant startsAt,
        Instant expiresAt,
        int maxUses,
        int currentUses,
        boolean active
) {
    public static CouponResponse from(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getType(),
                coupon.getValue(),
                coupon.getDescription(),
                coupon.getStartsAt(),
                coupon.getExpiresAt(),
                coupon.getMaxUses(),
                coupon.getCurrentUses(),
                coupon.isActive()
        );
    }
}
