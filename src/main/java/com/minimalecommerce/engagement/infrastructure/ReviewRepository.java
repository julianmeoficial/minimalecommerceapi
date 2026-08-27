package com.minimalecommerce.engagement.infrastructure;

import com.minimalecommerce.engagement.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    boolean existsByAuthorIdAndProductId(UUID authorId, UUID productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double averageForProduct(@Param("productId") UUID productId);
}
