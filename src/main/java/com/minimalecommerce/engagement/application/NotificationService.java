package com.minimalecommerce.engagement.application;

import com.minimalecommerce.engagement.api.dto.NotificationResponse;
import com.minimalecommerce.engagement.domain.Notification;
import com.minimalecommerce.engagement.domain.NotificationType;
import com.minimalecommerce.engagement.infrastructure.NotificationRepository;
import com.minimalecommerce.shared.api.PageResponse;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.domain.event.OrderPlacedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @EventListener
    @Transactional
    public void onOrderPlaced(OrderPlacedEvent event) {
        create(event.buyerId(), null, NotificationType.PEDIDO,
                "Pedido creado", "Tu pedido " + event.orderId() + " se registró por un total de " + event.total());
        event.lines().stream().map(OrderPlacedEvent.Line::sellerId).distinct().forEach(sellerId ->
                create(sellerId, event.buyerId(), NotificationType.PEDIDO,
                        "Nueva venta", "Recibiste un pedido que incluye tus productos"));
    }

    @Transactional
    public Notification create(UUID userId, UUID senderId, NotificationType type, String title, String message) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setSenderId(senderId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        return notifications.save(n);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(UUID userId, Pageable pageable) {
        return PageResponse.from(notifications.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(NotificationResponse::from));
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notifications.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markRead(UUID userId, UUID id) {
        Notification n = notifications.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("notificación", id));
        n.setRead(true);
        return NotificationResponse.from(n);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notifications.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId).forEach(n -> n.setRead(true));
    }
}
