package com.minimalecommerce.shared.domain.event;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record OrderPlacedEvent(
        UUID orderId,
        UUID buyerId,
        String couponCode,
        BigDecimal total,
        List<Line> lines
) {
    public record Line(UUID productId, UUID sellerId, int quantity, BigDecimal unitPrice) {
    }
}
