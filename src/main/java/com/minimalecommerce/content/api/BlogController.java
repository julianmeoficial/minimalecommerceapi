package com.minimalecommerce.content.api;

import com.minimalecommerce.content.api.dto.BlogPostRequest;
import com.minimalecommerce.content.api.dto.BlogPostResponse;
import com.minimalecommerce.content.application.BlogService;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/blog")
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping
    public PageResponse<BlogPostResponse> published(@PageableDefault(size = 20) Pageable pageable) {
        return blogService.published(pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BlogPostResponse create(@CurrentUser AuthPrincipal principal,
                                   @Valid @RequestBody BlogPostRequest request) {
        return blogService.create(principal, request);
    }

    @PostMapping("/{id}/publish")
    public BlogPostResponse publish(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        return blogService.publish(principal, id);
    }
}
