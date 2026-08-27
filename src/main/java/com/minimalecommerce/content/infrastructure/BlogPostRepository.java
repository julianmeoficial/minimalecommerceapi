package com.minimalecommerce.content.infrastructure;

import com.minimalecommerce.content.domain.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {
    Page<BlogPost> findByPublishedTrueOrderByPublishedAtDesc(Pageable pageable);
    Page<BlogPost> findByAuthorIdOrderByCreatedAtDesc(UUID authorId, Pageable pageable);
}
