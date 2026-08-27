package com.minimalecommerce.analytics.api;

import com.minimalecommerce.analytics.api.dto.SellerMetricResponse;
import com.minimalecommerce.analytics.application.SellerAnalyticsService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/metrics")
public class SellerMetricsController {

    private final SellerAnalyticsService analytics;

    public SellerMetricsController(SellerAnalyticsService analytics) {
        this.analytics = analytics;
    }

    @GetMapping
    public List<SellerMetricResponse> range(
            @CurrentUser AuthPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return analytics.range(principal, from, to);
    }
}
