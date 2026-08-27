package com.minimalecommerce.ordering.infrastructure;

import com.minimalecommerce.ordering.domain.Order;
import com.minimalecommerce.ordering.domain.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @EntityGraph(attributePaths = {"items", "buyer"})
    Optional<Order> findByBuyerIdAndIdempotencyKey(UUID buyerId, String idempotencyKey);

    @EntityGraph(attributePaths = {"items", "buyer"})
    Page<Order> findByBuyerIdOrderByPlacedAtDesc(UUID buyerId, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.sellerId = :sellerId")
    @EntityGraph(attributePaths = {"items", "buyer"})
    Page<Order> findBySellerId(@Param("sellerId") UUID sellerId, Pageable pageable);

    @EntityGraph(attributePaths = {"items", "buyer"})
    Optional<Order> findByIdAndBuyerId(UUID id, UUID buyerId);

    @EntityGraph(attributePaths = {"items", "buyer"})
    Optional<Order> findById(UUID id);

    @Query("""
            SELECT COUNT(o) > 0 FROM Order o
            JOIN o.items i
            WHERE o.buyer.id = :buyerId AND i.productId = :productId AND o.status = :status
            """)
    boolean existsPurchase(@Param("buyerId") UUID buyerId,
                           @Param("productId") UUID productId,
                           @Param("status") OrderStatus status);
}
