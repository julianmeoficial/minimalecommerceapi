package com.minimalecommerce.ordering.api;

import com.minimalecommerce.ordering.api.dto.OrderResponse;
import com.minimalecommerce.ordering.api.dto.UpdateOrderStatusRequest;
import com.minimalecommerce.ordering.application.OrderService;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public PageResponse<OrderResponse> mine(@CurrentUser AuthPrincipal principal,
                                            @PageableDefault(size = 20) Pageable pageable) {
        return orderService.mine(principal.userId(), pageable);
    }

    @GetMapping("/sold")
    @PreAuthorize("hasRole('VENDEDOR')")
    public PageResponse<OrderResponse> sold(@CurrentUser AuthPrincipal principal,
                                            @PageableDefault(size = 20) Pageable pageable) {
        return orderService.forSeller(principal.userId(), pageable);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        return orderService.get(principal, id);
    }

    @PutMapping("/{id}/status")
    public OrderResponse status(@CurrentUser AuthPrincipal principal,
                                @PathVariable UUID id,
                                @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(principal, id, request.status());
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        return orderService.cancel(principal, id);
    }
}
