package com.minimalecommerce.promotions.api;

import com.minimalecommerce.promotions.api.dto.CouponQuote;
import com.minimalecommerce.promotions.api.dto.CouponRequest;
import com.minimalecommerce.promotions.api.dto.CouponResponse;
import com.minimalecommerce.promotions.application.CouponService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse create(@CurrentUser AuthPrincipal principal,
                                 @Valid @RequestBody CouponRequest request) {
        return couponService.create(principal, request);
    }

    @GetMapping("/mine")
    public List<CouponResponse> mine(@CurrentUser AuthPrincipal principal) {
        return couponService.mine(principal);
    }

    @GetMapping("/quote")
    public CouponQuote quote(@RequestParam String code, @RequestParam BigDecimal subtotal) {
        return couponService.quote(code, subtotal);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        couponService.deactivate(principal, id);
    }
}
