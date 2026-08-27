package com.minimalecommerce.engagement.api;

import com.minimalecommerce.engagement.api.dto.ReviewRequest;
import com.minimalecommerce.engagement.api.dto.ReviewResponse;
import com.minimalecommerce.engagement.application.ReviewService;
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

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@CurrentUser AuthPrincipal principal, @Valid @RequestBody ReviewRequest request) {
        return reviewService.create(principal.userId(), request);
    }

    @GetMapping("/product/{productId}")
    public PageResponse<ReviewResponse> byProduct(@PathVariable UUID productId,
                                                  @PageableDefault(size = 20) Pageable pageable) {
        return reviewService.byProduct(productId, pageable);
    }

    @GetMapping("/product/{productId}/average")
    public Map<String, Double> average(@PathVariable UUID productId) {
        return Map.of("average", reviewService.average(productId));
    }
}
