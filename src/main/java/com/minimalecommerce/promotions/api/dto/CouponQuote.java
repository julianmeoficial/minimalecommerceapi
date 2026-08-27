package com.minimalecommerce.promotions.api.dto;

import java.math.BigDecimal;

public record CouponQuote(String code, BigDecimal discount, boolean valid) {
}
