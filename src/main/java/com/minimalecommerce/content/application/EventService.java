package com.minimalecommerce.content.application;

import com.minimalecommerce.content.api.dto.EventRequest;
import com.minimalecommerce.content.api.dto.EventResponse;
import com.minimalecommerce.content.domain.Event;
import com.minimalecommerce.content.infrastructure.EventRepository;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class EventService {

    private final EventRepository events;

    public EventService(EventRepository events) {
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> upcoming() {
        return events.findByActiveTrueAndStartsAtAfterOrderByStartsAtAsc(Instant.now())
                .stream().map(EventResponse::from).toList();
    }

    @Transactional
    public EventResponse create(AuthPrincipal principal, EventRequest request) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo un vendedor puede crear eventos");
        }
        Event event = new Event();
        event.setOrganizerId(principal.userId());
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartsAt(request.startsAt());
        event.setEndsAt(request.endsAt());
        event.setLocation(request.location());
        event.setImageUrl(request.imageUrl());
        events.save(event);
        return EventResponse.from(event);
    }

    @Transactional
    public EventResponse deactivate(AuthPrincipal principal, UUID id) {
        Event event = events.findById(id).orElseThrow(() -> new NotFoundException("evento", id));
        if (!event.getOrganizerId().equals(principal.userId())) {
            throw new ForbiddenException("Solo el organizador puede desactivar este evento");
        }
        event.setActive(false);
        return EventResponse.from(event);
    }
}
