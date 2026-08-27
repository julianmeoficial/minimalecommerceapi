package com.minimalecommerce.ordering.domain;

import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.shared.persistence.UuidEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "preorders")
public class Preorder extends UuidEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "preorder_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal preorderPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PreorderStatus status = PreorderStatus.PENDIENTE;

    @Column(length = 500)
    private String notes;

    @Column(name = "estimated_delivery")
    private Instant estimatedDelivery;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public BigDecimal getPreorderPrice() { return preorderPrice; }
    public void setPreorderPrice(BigDecimal preorderPrice) { this.preorderPrice = preorderPrice; }
    public PreorderStatus getStatus() { return status; }
    public void setStatus(PreorderStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(Instant estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
    public Instant getCreatedAt() { return createdAt; }
}
