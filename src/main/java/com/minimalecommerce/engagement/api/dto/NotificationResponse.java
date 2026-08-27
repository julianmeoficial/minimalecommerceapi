package com.minimalecommerce.engagement.api.dto;

import com.minimalecommerce.engagement.domain.Notification;
import com.minimalecommerce.engagement.domain.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id, NotificationType type, String title, String message, boolean read, Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(), n.isRead(), n.getCreatedAt());
    }
}
