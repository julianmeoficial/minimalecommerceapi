package com.minimalecommerce.engagement.api.dto;

import com.minimalecommerce.engagement.domain.Review;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id, UUID authorId, UUID productId, UUID sellerId,
        int rating, String comment, boolean verified, Instant createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(), review.getAuthorId(), review.getProductId(), review.getSellerId(),
                review.getRating(), review.getComment(), review.isVerified(), review.getCreatedAt()
        );
    }
}
