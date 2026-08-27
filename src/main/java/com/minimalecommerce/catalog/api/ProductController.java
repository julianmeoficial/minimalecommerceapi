package com.minimalecommerce.catalog.api;

import com.minimalecommerce.catalog.api.dto.ProductRequest;
import com.minimalecommerce.catalog.api.dto.ProductResponse;
import com.minimalecommerce.catalog.application.ProductService;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductResponse> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID sellerId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean preorder,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return productService.search(name, categoryId, sellerId, minPrice, maxPrice, preorder, pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable UUID id) {
        return productService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@CurrentUser AuthPrincipal principal,
                                  @Valid @RequestBody ProductRequest request) {
        return productService.create(principal, request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@CurrentUser AuthPrincipal principal,
                                  @PathVariable UUID id,
                                  @Valid @RequestBody ProductRequest request) {
        return productService.update(principal, id, request);
    }

    @PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponse image(@CurrentUser AuthPrincipal principal,
                                 @PathVariable UUID id,
                                 @RequestPart("file") MultipartFile file) {
        return productService.attachImage(principal, id, file);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        productService.deactivate(principal, id);
    }
}
