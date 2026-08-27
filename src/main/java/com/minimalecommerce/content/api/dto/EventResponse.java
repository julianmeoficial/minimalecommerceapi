package com.minimalecommerce.content.api.dto;

import com.minimalecommerce.content.domain.Event;

import java.time.Instant;
import java.util.UUID;

public record EventResponse(
        UUID id, UUID organizerId, String title, String description,
        Instant startsAt, Instant endsAt, String location, String imageUrl, boolean active
) {
    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(), event.getOrganizerId(), event.getTitle(), event.getDescription(),
                event.getStartsAt(), event.getEndsAt(), event.getLocation(), event.getImageUrl(), event.isActive()
        );
    }
}
