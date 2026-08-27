package com.minimalecommerce.ordering.domain;

import java.util.Set;

public enum OrderStatus {
    PENDIENTE,
    CONFIRMADO,
    ENVIADO,
    ENTREGADO,
    CANCELADO;

    public boolean canTransitionTo(OrderStatus next) {
        return switch (this) {
            case PENDIENTE -> next == CONFIRMADO || next == CANCELADO;
            case CONFIRMADO -> next == ENVIADO || next == CANCELADO;
            case ENVIADO -> next == ENTREGADO || next == CANCELADO;
            case ENTREGADO, CANCELADO -> false;
        };
    }

    public boolean isCancellable() {
        return this != ENTREGADO && this != CANCELADO;
    }

    public static Set<OrderStatus> open() {
        return Set.of(PENDIENTE, CONFIRMADO, ENVIADO);
    }
}
