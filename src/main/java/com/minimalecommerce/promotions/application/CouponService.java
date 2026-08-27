package com.minimalecommerce.promotions.application;

import com.minimalecommerce.identity.application.UserService;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.promotions.api.dto.CouponQuote;
import com.minimalecommerce.promotions.api.dto.CouponRequest;
import com.minimalecommerce.promotions.api.dto.CouponResponse;
import com.minimalecommerce.promotions.domain.Coupon;
import com.minimalecommerce.promotions.infrastructure.CouponRepository;
import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.ConflictException;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CouponService {

    private final CouponRepository coupons;
    private final UserService users;

    public CouponService(CouponRepository coupons, UserService users) {
        this.coupons = coupons;
        this.users = users;
    }

    @Transactional
    public CouponResponse create(AuthPrincipal principal, CouponRequest request) {
        requireSeller(principal);
        String code = request.code().trim().toUpperCase();
        if (coupons.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("COUPON_EXISTS", "Ya existe un cupón con ese código");
        }
        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setType(request.type());
        coupon.setValue(request.value());
        coupon.setDescription(request.description());
        coupon.setStartsAt(request.startsAt());
        coupon.setExpiresAt(request.expiresAt());
        coupon.setMaxUses(request.maxUses());
        coupon.setCreator(users.require(principal.userId()));
        coupons.save(coupon);
        return CouponResponse.from(coupon);
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> mine(AuthPrincipal principal) {
        requireSeller(principal);
        return coupons.findByCreatorIdOrderByCreatedAtDesc(principal.userId())
                .stream().map(CouponResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CouponQuote quote(String code, BigDecimal subtotal) {
        Coupon coupon = coupons.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new NotFoundException("cupón", code));
        boolean valid = coupon.canBeUsed(Instant.now());
        BigDecimal discount = valid ? coupon.discountFor(subtotal) : BigDecimal.ZERO;
        return new CouponQuote(coupon.getCode(), discount, valid);
    }

    /**
     * Bloquea el cupón, valida vigencia/usos y lo incrementa en la misma transacción del checkout.
     */
    @Transactional
    public RedeemedCoupon redeem(String code, BigDecimal subtotal) {
        Coupon coupon = coupons.lockByCode(code.trim())
                .orElseThrow(() -> new NotFoundException("cupón", code));
        if (!coupon.canBeUsed(Instant.now())) {
            throw new BusinessException("COUPON_INVALID", "El cupón no es válido o está vencido");
        }
        BigDecimal discount = coupon.discountFor(subtotal);
        coupon.redeem();
        return new RedeemedCoupon(coupon.getId(), coupon.getCode(), discount);
    }

    @Transactional
    public void deactivate(AuthPrincipal principal, UUID id) {
        requireSeller(principal);
        Coupon coupon = coupons.findById(id).orElseThrow(() -> new NotFoundException("cupón", id));
        if (!coupon.getCreator().getId().equals(principal.userId())) {
            throw new ForbiddenException("Solo el creador puede desactivar este cupón");
        }
        coupon.setActive(false);
    }

    private void requireSeller(AuthPrincipal principal) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo un vendedor puede gestionar cupones");
        }
    }

    public record RedeemedCoupon(UUID id, String code, BigDecimal discount) {
    }
}
