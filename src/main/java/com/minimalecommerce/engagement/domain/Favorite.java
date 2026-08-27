package com.minimalecommerce.engagement.domain;

import com.minimalecommerce.shared.persistence.UuidEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "favorites")
public class Favorite extends UuidEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "notify_stock", nullable = false)
    private boolean notifyStock;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public boolean isNotifyStock() { return notifyStock; }
    public void setNotifyStock(boolean notifyStock) { this.notifyStock = notifyStock; }
}
