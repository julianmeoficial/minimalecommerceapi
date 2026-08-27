package com.minimalecommerce.ordering.api.dto;

import com.minimalecommerce.ordering.domain.Order;
import com.minimalecommerce.ordering.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID buyerId,
        Instant placedAt,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal total,
        OrderStatus status,
        String shippingAddress,
        String couponCode,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getBuyer().getId(),
                order.getPlacedAt(),
                order.getSubtotal(),
                order.getDiscount(),
                order.getTotal(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getCouponCode(),
                order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
