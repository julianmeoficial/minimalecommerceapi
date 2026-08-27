package com.minimalecommerce.ordering.application;

import com.minimalecommerce.catalog.application.CatalogStockPort;
import com.minimalecommerce.identity.application.AddressService;
import com.minimalecommerce.identity.application.UserService;
import com.minimalecommerce.identity.domain.Address;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.ordering.api.dto.CheckoutRequest;
import com.minimalecommerce.ordering.api.dto.OrderResponse;
import com.minimalecommerce.ordering.domain.CartItem;
import com.minimalecommerce.ordering.domain.Order;
import com.minimalecommerce.ordering.domain.OrderItem;
import com.minimalecommerce.ordering.infrastructure.CartItemRepository;
import com.minimalecommerce.ordering.infrastructure.OrderRepository;
import com.minimalecommerce.promotions.application.CouponService;
import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.event.OrderPlacedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import com.minimalecommerce.ordering.api.dto.OrderResponse;
import com.minimalecommerce.ordering.domain.CartItem;
import com.minimalecommerce.ordering.domain.Order;
import com.minimalecommerce.ordering.domain.OrderItem;
import com.minimalecommerce.ordering.infrastructure.CartItemRepository;
import com.minimalecommerce.ordering.infrastructure.OrderRepository;
import com.minimalecommerce.promotions.application.CouponService;
import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.event.OrderPlacedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {

    private final CartItemRepository cartItems;
    private final OrderRepository orders;
    private final CatalogStockPort catalog;
    private final CouponService coupons;
    private final AddressService addresses;
    private final UserService users;
    private final ApplicationEventPublisher events;

    public CheckoutService(CartItemRepository cartItems,
                           OrderRepository orders,
                           CatalogStockPort catalog,
                           CouponService coupons,
                           AddressService addresses,
                           UserService users,
                           ApplicationEventPublisher events) {
        this.cartItems = cartItems;
        this.orders = orders;
        this.catalog = catalog;
        this.coupons = coupons;
        this.addresses = addresses;
        this.users = users;
        this.events = events;
    }

    @Transactional
    public OrderResponse checkout(UUID buyerId, CheckoutRequest request, String idempotencyKey) {
        if (StringUtils.hasText(idempotencyKey)) {
            var existing = orders.findByBuyerIdAndIdempotencyKey(buyerId, idempotencyKey);
            if (existing.isPresent()) {
                return OrderResponse.from(existing.get());
            }
        }

        List<CartItem> items = cartItems.findByUserIdOrderByAddedAtAsc(buyerId);
        if (items.isEmpty()) {
            throw new BusinessException("EMPTY_CART", "El carrito está vacío");
        }

        String shipping = resolveShipping(buyerId, request);
        User buyer = users.require(buyerId);

        record LineDraft(UUID productId, UUID sellerId, String productName, int quantity, BigDecimal unitPrice) {
        }

        List<LineDraft> drafts = items.stream()
                .map(item -> new LineDraft(
                        item.getProduct().getId(),
                        item.getProduct().getSeller().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (LineDraft draft : drafts) {
            catalog.requireActive(draft.productId());
            catalog.decrement(draft.productId(), draft.quantity());
            subtotal = subtotal.add(draft.unitPrice().multiply(BigDecimal.valueOf(draft.quantity())));
        }

        BigDecimal discount = BigDecimal.ZERO;
        UUID couponId = null;
        String couponCode = null;
        if (StringUtils.hasText(request.couponCode())) {
            CouponService.RedeemedCoupon redeemed = coupons.redeem(request.couponCode(), subtotal);
            discount = redeemed.discount();
            couponId = redeemed.id();
            couponCode = redeemed.code();
        }

        BigDecimal total = subtotal.subtract(discount);
        if (total.signum() < 0) {
            total = BigDecimal.ZERO;
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setTotal(total);
        order.setShippingAddress(shipping);
        order.setCouponId(couponId);
        order.setCouponCode(couponCode);
        if (StringUtils.hasText(idempotencyKey)) {
            order.setIdempotencyKey(idempotencyKey);
        }
        for (LineDraft draft : drafts) {
            OrderItem line = new OrderItem();
            line.setProductId(draft.productId());
            line.setSellerId(draft.sellerId());
            line.setProductName(draft.productName());
            line.setQuantity(draft.quantity());
            line.setUnitPrice(draft.unitPrice());
            order.addItem(line);
        }
        orders.save(order);
        cartItems.deleteByUserId(buyerId);

        events.publishEvent(new OrderPlacedEvent(
                order.getId(),
                buyerId,
                couponCode,
                total,
                order.getItems().stream()
                        .map(i -> new OrderPlacedEvent.Line(i.getProductId(), i.getSellerId(), i.getQuantity(), i.getUnitPrice()))
                        .toList()
        ));
        return OrderResponse.from(order);
    }

    private String resolveShipping(UUID buyerId, CheckoutRequest request) {
        if (request.addressId() != null) {
            Address address = addresses.requireOwned(buyerId, request.addressId());
            return address.format();
        }
        if (StringUtils.hasText(request.shippingAddress())) {
            return request.shippingAddress();
        }
        throw new BusinessException("ADDRESS_REQUIRED", "Indica una dirección de entrega");
    }
}
