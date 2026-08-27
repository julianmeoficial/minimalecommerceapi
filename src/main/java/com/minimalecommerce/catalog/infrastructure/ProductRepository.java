package com.minimalecommerce.catalog.infrastructure;

import com.minimalecommerce.catalog.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findByActiveTrueAndCategoryId(UUID categoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findByActiveTrueAndSellerId(UUID sellerId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findByActiveTrueAndNameContainingIgnoreCase(String name, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findByActiveTrueAndPriceBetween(BigDecimal min, BigDecimal max, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findByActiveTrueAndPreorderTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Optional<Product> findByIdAndActiveTrue(UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.stock = p.stock - :qty, p.version = p.version + 1 WHERE p.id = :id AND p.stock >= :qty AND p.active = true")
    int decrementStock(@Param("id") UUID id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.stock = p.stock + :qty WHERE p.id = :id")
    int incrementStock(@Param("id") UUID id, @Param("qty") int qty);
}
