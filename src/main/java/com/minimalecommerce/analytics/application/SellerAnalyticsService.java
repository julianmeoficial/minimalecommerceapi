package com.minimalecommerce.analytics.application;

import com.minimalecommerce.analytics.api.dto.SellerMetricResponse;
import com.minimalecommerce.analytics.domain.SellerMetric;
import com.minimalecommerce.analytics.infrastructure.SellerMetricRepository;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.event.OrderPlacedEvent;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SellerAnalyticsService {

    private final SellerMetricRepository metrics;

    public SellerAnalyticsService(SellerMetricRepository metrics) {
        this.metrics = metrics;
    }

    @EventListener
    @Transactional
    public void onOrderPlaced(OrderPlacedEvent event) {
        LocalDate today = LocalDate.now();
        Map<UUID, List<OrderPlacedEvent.Line>> bySeller = event.lines().stream()
                .collect(Collectors.groupingBy(OrderPlacedEvent.Line::sellerId));
        bySeller.forEach((sellerId, lines) -> {
            int units = lines.stream().mapToInt(OrderPlacedEvent.Line::quantity).sum();
            BigDecimal amount = lines.stream()
                    .map(l -> l.unitPrice().multiply(BigDecimal.valueOf(l.quantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            SellerMetric metric = metrics.findBySellerIdAndMetricDate(sellerId, today)
                    .orElseGet(() -> {
                        SellerMetric created = new SellerMetric();
                        created.setSellerId(sellerId);
                        created.setMetricDate(today);
                        return created;
                    });
            metric.addSale(units, amount);
            metrics.save(metric);
        });
    }

    @Transactional(readOnly = true)
    public List<SellerMetricResponse> range(AuthPrincipal principal, LocalDate from, LocalDate to) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo un vendedor puede ver sus métricas");
        }
        LocalDate start = from != null ? from : LocalDate.now().minusMonths(1);
        LocalDate end = to != null ? to : LocalDate.now();
        return metrics.findBySellerIdAndMetricDateBetweenOrderByMetricDateAsc(principal.userId(), start, end)
                .stream().map(SellerMetricResponse::from).toList();
    }
}
