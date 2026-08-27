package com.minimalecommerce.content.application;

import com.minimalecommerce.content.api.dto.BlogPostRequest;
import com.minimalecommerce.content.api.dto.BlogPostResponse;
import com.minimalecommerce.content.domain.BlogPost;
import com.minimalecommerce.content.infrastructure.BlogPostRepository;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class BlogService {

    private final BlogPostRepository posts;

    public BlogService(BlogPostRepository posts) {
        this.posts = posts;
    }

    @Transactional(readOnly = true)
    public PageResponse<BlogPostResponse> published(Pageable pageable) {
        return PageResponse.from(posts.findByPublishedTrueOrderByPublishedAtDesc(pageable).map(BlogPostResponse::from));
    }

    @Transactional
    public BlogPostResponse create(AuthPrincipal principal, BlogPostRequest request) {
        requireSeller(principal);
        BlogPost post = new BlogPost();
        post.setAuthorId(principal.userId());
        apply(post, request);
        posts.save(post);
        return BlogPostResponse.from(post);
    }

    @Transactional
    public BlogPostResponse publish(AuthPrincipal principal, UUID id) {
        BlogPost post = owned(principal, id);
        post.setPublished(true);
        post.setPublishedAt(Instant.now());
        return BlogPostResponse.from(post);
    }

    private BlogPost owned(AuthPrincipal principal, UUID id) {
        requireSeller(principal);
        BlogPost post = posts.findById(id).orElseThrow(() -> new NotFoundException("artículo", id));
        if (!post.getAuthorId().equals(principal.userId())) {
            throw new ForbiddenException("Solo el autor puede publicar este artículo");
        }
        return post;
    }

    private void apply(BlogPost post, BlogPostRequest request) {
        post.setTitle(request.title());
        post.setSummary(request.summary());
        post.setBody(request.body());
        post.setCategoryId(request.categoryId());
        post.setImageUrl(request.imageUrl());
    }

    private void requireSeller(AuthPrincipal principal) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo un vendedor puede publicar contenido");
        }
    }
}
