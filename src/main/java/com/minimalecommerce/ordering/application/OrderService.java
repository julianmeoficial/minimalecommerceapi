package com.minimalecommerce.ordering.application;

import com.minimalecommerce.catalog.application.CatalogStockPort;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.ordering.api.dto.OrderResponse;
import com.minimalecommerce.ordering.domain.Order;
import com.minimalecommerce.ordering.domain.OrderStatus;
import com.minimalecommerce.ordering.infrastructure.OrderRepository;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orders;
    private final CatalogStockPort catalog;

    public OrderService(OrderRepository orders, CatalogStockPort catalog) {
        this.orders = orders;
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> mine(UUID buyerId, Pageable pageable) {
        return PageResponse.from(orders.findByBuyerIdOrderByPlacedAtDesc(buyerId, pageable).map(OrderResponse::from));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> forSeller(UUID sellerId, Pageable pageable) {
        return PageResponse.from(orders.findBySellerId(sellerId, pageable).map(OrderResponse::from));
    }

    @Transactional(readOnly = true)
    public OrderResponse get(AuthPrincipal principal, UUID id) {
        Order order = orders.findById(id).orElseThrow(() -> new NotFoundException("pedido", id));
        boolean buyer = order.getBuyer().getId().equals(principal.userId());
        boolean seller = order.getItems().stream().anyMatch(i -> i.getSellerId().equals(principal.userId()));
        if (!buyer && !seller) {
            throw new ForbiddenException("No puedes ver este pedido");
        }
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse updateStatus(AuthPrincipal principal, UUID id, OrderStatus next) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo el vendedor puede cambiar el estado");
        }
        Order order = orders.findById(id).orElseThrow(() -> new NotFoundException("pedido", id));
        boolean owns = order.getItems().stream().anyMatch(i -> i.getSellerId().equals(principal.userId()));
        if (!owns) {
            throw new ForbiddenException("Este pedido no contiene tus productos");
        }
        if (!order.getStatus().canTransitionTo(next)) {
            throw new BusinessException("INVALID_STATUS", "No se puede pasar de " + order.getStatus() + " a " + next);
        }
        order.setStatus(next);
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse cancel(AuthPrincipal principal, UUID id) {
        Order order = orders.findByIdAndBuyerId(id, principal.userId())
                .orElseThrow(() -> new NotFoundException("pedido", id));
        if (!order.getStatus().isCancellable()) {
            throw new BusinessException("NOT_CANCELLABLE", "El pedido ya no se puede cancelar");
        }
        order.setStatus(OrderStatus.CANCELADO);
        order.getItems().forEach(item -> catalog.restore(item.getProductId(), item.getQuantity()));
        return OrderResponse.from(order);
    }
}
