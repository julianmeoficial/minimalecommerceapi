package com.minimalecommerce.analytics.infrastructure;

import com.minimalecommerce.analytics.domain.SellerMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SellerMetricRepository extends JpaRepository<SellerMetric, UUID> {

    Optional<SellerMetric> findBySellerIdAndMetricDate(UUID sellerId, LocalDate date);

    List<SellerMetric> findBySellerIdAndMetricDateBetweenOrderByMetricDateAsc(UUID sellerId, LocalDate from, LocalDate to);
}
