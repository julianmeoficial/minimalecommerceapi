package com.minimalecommerce.content.api;

import com.minimalecommerce.content.api.dto.EventRequest;
import com.minimalecommerce.content.api.dto.EventResponse;
import com.minimalecommerce.content.application.EventService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventResponse> upcoming() {
        return eventService.upcoming();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@CurrentUser AuthPrincipal principal, @Valid @RequestBody EventRequest request) {
        return eventService.create(principal, request);
    }

    @PostMapping("/{id}/deactivate")
    public EventResponse deactivate(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        return eventService.deactivate(principal, id);
    }
}
