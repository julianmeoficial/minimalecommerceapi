package com.minimalecommerce.ordering.api.dto;

import com.minimalecommerce.ordering.domain.CartItem;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponse(
        UUID id,
        UUID productId,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        int availableStock
) {
    public static CartItemResponse from(CartItem item) {
        return new CartItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.subtotal(),
                item.getProduct().getStock()
        );
    }
}
