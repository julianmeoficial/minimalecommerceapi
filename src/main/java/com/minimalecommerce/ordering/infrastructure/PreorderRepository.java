package com.minimalecommerce.ordering.infrastructure;

import com.minimalecommerce.ordering.domain.Preorder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PreorderRepository extends JpaRepository<Preorder, UUID> {

    List<Preorder> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Preorder> findByProductSellerIdOrderByCreatedAtDesc(UUID sellerId);
}
