package com.minimalecommerce.ordering.api.dto;

import com.minimalecommerce.ordering.domain.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID productId,
        UUID sellerId,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getProductId(),
                item.getSellerId(),
                item.getProductName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.subtotal()
        );
    }
}
