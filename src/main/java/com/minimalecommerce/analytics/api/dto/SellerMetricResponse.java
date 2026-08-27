package com.minimalecommerce.analytics.api.dto;

import com.minimalecommerce.analytics.domain.SellerMetric;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SellerMetricResponse(
        LocalDate date, int unitsSold, BigDecimal salesTotal, int ordersCompleted
) {
    public static SellerMetricResponse from(SellerMetric metric) {
        return new SellerMetricResponse(
                metric.getMetricDate(), metric.getUnitsSold(), metric.getSalesTotal(), metric.getOrdersCompleted()
        );
    }
}
