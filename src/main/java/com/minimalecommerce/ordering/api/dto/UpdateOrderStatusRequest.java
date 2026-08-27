package com.minimalecommerce.ordering.api.dto;

import com.minimalecommerce.ordering.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {
}
