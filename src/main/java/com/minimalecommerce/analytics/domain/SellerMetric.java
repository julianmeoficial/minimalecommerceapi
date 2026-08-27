package com.minimalecommerce.analytics.domain;

import com.minimalecommerce.shared.persistence.UuidEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "seller_metrics")
public class SellerMetric extends UuidEntity {

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "units_sold", nullable = false)
    private int unitsSold;

    @Column(name = "sales_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal salesTotal = BigDecimal.ZERO;

    @Column(name = "orders_completed", nullable = false)
    private int ordersCompleted;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public void addSale(int units, BigDecimal amount) {
        this.unitsSold += units;
        this.salesTotal = this.salesTotal.add(amount);
        this.ordersCompleted += 1;
        this.updatedAt = Instant.now();
    }

    public UUID getSellerId() { return sellerId; }
    public void setSellerId(UUID sellerId) { this.sellerId = sellerId; }
    public LocalDate getMetricDate() { return metricDate; }
    public void setMetricDate(LocalDate metricDate) { this.metricDate = metricDate; }
    public int getUnitsSold() { return unitsSold; }
    public BigDecimal getSalesTotal() { return salesTotal; }
    public int getOrdersCompleted() { return ordersCompleted; }
    public Instant getUpdatedAt() { return updatedAt; }
}
