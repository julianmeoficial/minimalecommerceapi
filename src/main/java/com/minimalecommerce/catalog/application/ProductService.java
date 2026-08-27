package com.minimalecommerce.catalog.application;

import com.minimalecommerce.catalog.api.dto.ProductRequest;
import com.minimalecommerce.catalog.api.dto.ProductResponse;
import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.catalog.infrastructure.ProductRepository;
import com.minimalecommerce.identity.application.UserService;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.media.MediaStore;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository products;
    private final CategoryService categories;
    private final UserService users;
    private final MediaStore mediaStore;

    public ProductService(ProductRepository products, CategoryService categories, UserService users, MediaStore mediaStore) {
        this.products = products;
        this.categories = categories;
        this.users = users;
        this.mediaStore = mediaStore;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String name, UUID categoryId, UUID sellerId,
                                                BigDecimal minPrice, BigDecimal maxPrice,
                                                Boolean preorder, Pageable pageable) {
        var page = products.findByActiveTrue(pageable);
        if (name != null && !name.isBlank()) {
            page = products.findByActiveTrueAndNameContainingIgnoreCase(name, pageable);
        } else if (categoryId != null) {
            page = products.findByActiveTrueAndCategoryId(categoryId, pageable);
        } else if (sellerId != null) {
            page = products.findByActiveTrueAndSellerId(sellerId, pageable);
        } else if (minPrice != null && maxPrice != null) {
            page = products.findByActiveTrueAndPriceBetween(minPrice, maxPrice, pageable);
        } else if (Boolean.TRUE.equals(preorder)) {
            page = products.findByActiveTrueAndPreorderTrue(pageable);
        }
        return PageResponse.from(page.map(ProductResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductResponse get(UUID id) {
        return ProductResponse.from(requireActive(id));
    }

    @Transactional(readOnly = true)
    public Product requireActive(UUID id) {
        return products.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("producto", id));
    }

    @Transactional
    public ProductResponse create(AuthPrincipal principal, ProductRequest request) {
        requireSeller(principal);
        User seller = users.require(principal.userId());
        Product product = new Product();
        product.setSeller(seller);
        apply(product, request);
        products.save(product);
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse update(AuthPrincipal principal, UUID id, ProductRequest request) {
        Product product = owned(principal, id);
        apply(product, request);
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse attachImage(AuthPrincipal principal, UUID id, MultipartFile file) {
        Product product = owned(principal, id);
        if (product.getImageUrl() != null) {
            mediaStore.delete(stripPrefix(product.getImageUrl()));
        }
        String filename = mediaStore.store(file);
        product.setImageUrl("/api/v1/media/" + filename);
        return ProductResponse.from(product);
    }

    @Transactional
    public void deactivate(AuthPrincipal principal, UUID id) {
        owned(principal, id).setActive(false);
    }

    private Product owned(AuthPrincipal principal, UUID id) {
        requireSeller(principal);
        Product product = products.findById(id).orElseThrow(() -> new NotFoundException("producto", id));
        if (!product.getSeller().getId().equals(principal.userId())) {
            throw new ForbiddenException("Solo el vendedor dueño puede modificar este producto");
        }
        return product;
    }

    private void apply(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(categories.require(request.categoryId()));
        product.setPreorder(request.preorder());
    }

    private void requireSeller(AuthPrincipal principal) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo un vendedor puede gestionar el catálogo");
        }
    }

    private String stripPrefix(String url) {
        int idx = url.lastIndexOf('/');
        return idx >= 0 ? url.substring(idx + 1) : url;
    }
}
