package com.minimalecommerce.ordering.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(List<CartItemResponse> items, int itemCount, BigDecimal subtotal) {
}
