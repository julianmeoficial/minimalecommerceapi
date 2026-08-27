package com.minimalecommerce.content.api.dto;

import com.minimalecommerce.content.domain.BlogPost;

import java.time.Instant;
import java.util.UUID;

public record BlogPostResponse(
        UUID id, UUID authorId, UUID categoryId, String title, String summary,
        String body, String imageUrl, boolean published, Instant publishedAt
) {
    public static BlogPostResponse from(BlogPost post) {
        return new BlogPostResponse(
                post.getId(), post.getAuthorId(), post.getCategoryId(), post.getTitle(), post.getSummary(),
                post.getBody(), post.getImageUrl(), post.isPublished(), post.getPublishedAt()
        );
    }
}
