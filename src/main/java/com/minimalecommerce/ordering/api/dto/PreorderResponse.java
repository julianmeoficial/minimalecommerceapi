package com.minimalecommerce.ordering.api.dto;

import com.minimalecommerce.ordering.domain.Preorder;
import com.minimalecommerce.ordering.domain.PreorderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PreorderResponse(
        UUID id,
        UUID productId,
        String productName,
        int quantity,
        BigDecimal preorderPrice,
        PreorderStatus status,
        String notes,
        Instant estimatedDelivery,
        Instant createdAt
) {
    public static PreorderResponse from(Preorder preorder) {
        return new PreorderResponse(
                preorder.getId(),
                preorder.getProduct().getId(),
                preorder.getProduct().getName(),
                preorder.getQuantity(),
                preorder.getPreorderPrice(),
                preorder.getStatus(),
                preorder.getNotes(),
                preorder.getEstimatedDelivery(),
                preorder.getCreatedAt()
        );
    }
}
