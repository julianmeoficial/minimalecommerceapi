package com.minimalecommerce.catalog.application;

import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.catalog.infrastructure.ProductRepository;
import com.minimalecommerce.shared.domain.ConflictException;
import com.minimalecommerce.shared.domain.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CatalogStockPort {

    private final ProductRepository products;

    public CatalogStockPort(ProductRepository products) {
        this.products = products;
    }

    @Transactional(readOnly = true)
    public Product requireActive(UUID productId) {
        return products.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new NotFoundException("producto", productId));
    }

    @Transactional
    public void decrement(UUID productId, int quantity) {
        int updated = products.decrementStock(productId, quantity);
        if (updated == 0) {
            throw new ConflictException("STOCK_INSUFFICIENT", "Stock insuficiente para el producto " + productId);
        }
    }

    @Transactional
    public void restore(UUID productId, int quantity) {
        products.incrementStock(productId, quantity);
    }
}
