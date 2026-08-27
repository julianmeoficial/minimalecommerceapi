package com.minimalecommerce.identity.domain;

import com.minimalecommerce.shared.persistence.UuidEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "addresses")
public class Address extends UuidEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "full_address", nullable = false, length = 400)
    private String fullAddress;

    @Column(length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 20)
    private String phone;

    @Column(name = "primary_address", nullable = false)
    private boolean primaryAddress;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String format() {
        StringBuilder sb = new StringBuilder(fullAddress);
        if (city != null && !city.isBlank()) {
            sb.append(", ").append(city);
        }
        if (postalCode != null && !postalCode.isBlank()) {
            sb.append(" ").append(postalCode);
        }
        return sb.toString();
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getFullAddress() { return fullAddress; }
    public void setFullAddress(String fullAddress) { this.fullAddress = fullAddress; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public boolean isPrimaryAddress() { return primaryAddress; }
    public void setPrimaryAddress(boolean primaryAddress) { this.primaryAddress = primaryAddress; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
