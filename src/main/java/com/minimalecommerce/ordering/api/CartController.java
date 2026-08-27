package com.minimalecommerce.ordering.api;

import com.minimalecommerce.ordering.api.dto.AddCartItemRequest;
import com.minimalecommerce.ordering.api.dto.CartResponse;
import com.minimalecommerce.ordering.api.dto.CheckoutRequest;
import com.minimalecommerce.ordering.api.dto.OrderResponse;
import com.minimalecommerce.ordering.api.dto.UpdateCartItemRequest;
import com.minimalecommerce.ordering.application.CartService;
import com.minimalecommerce.ordering.application.CheckoutService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;
    private final CheckoutService checkoutService;

    public CartController(CartService cartService, CheckoutService checkoutService) {
        this.cartService = cartService;
        this.checkoutService = checkoutService;
    }

    @GetMapping
    public CartResponse get(@CurrentUser AuthPrincipal principal) {
        return cartService.get(principal.userId());
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartResponse add(@CurrentUser AuthPrincipal principal,
                            @Valid @RequestBody AddCartItemRequest request) {
        return cartService.add(principal.userId(), request);
    }

    @PutMapping("/items/{itemId}")
    public CartResponse update(@CurrentUser AuthPrincipal principal,
                               @PathVariable UUID itemId,
                               @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateQuantity(principal.userId(), itemId, request.quantity());
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse remove(@CurrentUser AuthPrincipal principal, @PathVariable UUID itemId) {
        return cartService.remove(principal.userId(), itemId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@CurrentUser AuthPrincipal principal) {
        cartService.clear(principal.userId());
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(@CurrentUser AuthPrincipal principal,
                                  @Valid @RequestBody CheckoutRequest request,
                                  @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return checkoutService.checkout(principal.userId(), request, idempotencyKey);
    }
}
