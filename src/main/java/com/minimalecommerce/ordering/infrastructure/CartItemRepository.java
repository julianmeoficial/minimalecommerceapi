package com.minimalecommerce.ordering.infrastructure;

import com.minimalecommerce.ordering.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    @Query("""
            SELECT ci FROM CartItem ci
            JOIN FETCH ci.product p
            JOIN FETCH p.seller
            JOIN FETCH p.category
            WHERE ci.user.id = :userId
            ORDER BY ci.addedAt ASC
            """)
    List<CartItem> findByUserIdOrderByAddedAtAsc(@Param("userId") UUID userId);

    Optional<CartItem> findByUserIdAndProductId(UUID userId, UUID productId);

    Optional<CartItem> findByIdAndUserId(UUID id, UUID userId);

    void deleteByUserId(UUID userId);

    long countByUserId(UUID userId);
}
