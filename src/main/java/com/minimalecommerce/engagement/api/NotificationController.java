package com.minimalecommerce.engagement.api;

import com.minimalecommerce.engagement.api.dto.NotificationResponse;
import com.minimalecommerce.engagement.application.NotificationService;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public PageResponse<NotificationResponse> list(@CurrentUser AuthPrincipal principal,
                                                   @PageableDefault(size = 20) Pageable pageable) {
        return notificationService.list(principal.userId(), pageable);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread(@CurrentUser AuthPrincipal principal) {
        return Map.of("count", notificationService.unreadCount(principal.userId()));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse read(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        return notificationService.markRead(principal.userId(), id);
    }

    @PostMapping("/read-all")
    public void readAll(@CurrentUser AuthPrincipal principal) {
        notificationService.markAllRead(principal.userId());
    }
}
