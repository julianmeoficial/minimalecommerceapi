package com.minimalecommerce.engagement.application;

import com.minimalecommerce.catalog.application.CatalogStockPort;
import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.engagement.api.dto.ReviewRequest;
import com.minimalecommerce.engagement.api.dto.ReviewResponse;
import com.minimalecommerce.engagement.domain.Review;
import com.minimalecommerce.engagement.infrastructure.ReviewRepository;
import com.minimalecommerce.ordering.domain.OrderStatus;
import com.minimalecommerce.ordering.infrastructure.OrderRepository;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.domain.ConflictException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final CatalogStockPort catalog;
    private final OrderRepository orders;

    public ReviewService(ReviewRepository reviews, CatalogStockPort catalog, OrderRepository orders) {
        this.reviews = reviews;
        this.catalog = catalog;
        this.orders = orders;
    }

    @Transactional
    public ReviewResponse create(UUID authorId, ReviewRequest request) {
        if (reviews.existsByAuthorIdAndProductId(authorId, request.productId())) {
            throw new ConflictException("REVIEW_EXISTS", "Ya reseñaste este producto");
        }
        Product product = catalog.requireActive(request.productId());
        boolean verified = orders.existsPurchase(authorId, product.getId(), OrderStatus.ENTREGADO);
        Review review = new Review();
        review.setAuthorId(authorId);
        review.setProductId(product.getId());
        review.setSellerId(product.getSeller().getId());
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setVerified(verified);
        reviews.save(review);
        return ReviewResponse.from(review);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> byProduct(UUID productId, Pageable pageable) {
        return PageResponse.from(reviews.findByProductIdOrderByCreatedAtDesc(productId, pageable).map(ReviewResponse::from));
    }

    @Transactional(readOnly = true)
    public Double average(UUID productId) {
        Double avg = reviews.averageForProduct(productId);
        return avg == null ? 0.0 : avg;
    }
}
