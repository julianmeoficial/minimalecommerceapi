package com.minimalecommerce.catalog.api.dto;

import com.minimalecommerce.catalog.domain.Product;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        int stock,
        String imageUrl,
        UUID categoryId,
        String categoryName,
        UUID sellerId,
        String sellerName,
        boolean preorder,
        boolean active
) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getImageUrl(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getSeller().getId(),
                product.getSeller().getName(),
                product.isPreorder(),
                product.isActive()
        );
    }
}
