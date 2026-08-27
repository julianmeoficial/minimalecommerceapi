package com.minimalecommerce.ordering.application;

import com.minimalecommerce.catalog.application.CatalogStockPort;
import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.identity.application.UserService;
import com.minimalecommerce.ordering.api.dto.AddCartItemRequest;
import com.minimalecommerce.ordering.api.dto.CartItemResponse;
import com.minimalecommerce.ordering.api.dto.CartResponse;
import com.minimalecommerce.ordering.domain.CartItem;
import com.minimalecommerce.ordering.infrastructure.CartItemRepository;
import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CartService {

    private final CartItemRepository cartItems;
    private final CatalogStockPort catalog;
    private final UserService users;

    public CartService(CartItemRepository cartItems, CatalogStockPort catalog, UserService users) {
        this.cartItems = cartItems;
        this.catalog = catalog;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public CartResponse get(UUID userId) {
        List<CartItemResponse> items = cartItems.findByUserIdOrderByAddedAtAsc(userId)
                .stream().map(CartItemResponse::from).toList();
        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartResponse(items, items.size(), subtotal);
    }

    @Transactional
    public CartResponse add(UUID userId, AddCartItemRequest request) {
        Product product = catalog.requireActive(request.productId());
        if (product.getStock() < request.quantity()) {
            throw new BusinessException("STOCK_INSUFFICIENT", "No hay stock suficiente");
        }
        CartItem item = cartItems.findByUserIdAndProductId(userId, product.getId())
                .orElseGet(() -> {
                    CartItem created = new CartItem();
                    created.setUser(users.require(userId));
                    created.setProduct(product);
                    created.setUnitPrice(product.getPrice());
                    created.setQuantity(0);
                    return created;
                });
        int nextQty = item.getQuantity() + request.quantity();
        if (product.getStock() < nextQty) {
            throw new BusinessException("STOCK_INSUFFICIENT", "No hay stock suficiente");
        }
        item.setQuantity(nextQty);
        item.setUnitPrice(product.getPrice());
        cartItems.save(item);
        return get(userId);
    }

    @Transactional
    public CartResponse updateQuantity(UUID userId, UUID itemId, int quantity) {
        CartItem item = cartItems.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new NotFoundException("ítem de carrito", itemId));
        if (item.getProduct().getStock() < quantity) {
            throw new BusinessException("STOCK_INSUFFICIENT", "No hay stock suficiente");
        }
        item.setQuantity(quantity);
        return get(userId);
    }

    @Transactional
    public CartResponse remove(UUID userId, UUID itemId) {
        CartItem item = cartItems.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new NotFoundException("ítem de carrito", itemId));
        cartItems.delete(item);
        return get(userId);
    }

    @Transactional
    public void clear(UUID userId) {
        cartItems.deleteByUserId(userId);
    }
}
