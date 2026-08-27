package com.minimalecommerce.content.infrastructure;

import com.minimalecommerce.content.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByActiveTrueAndStartsAtAfterOrderByStartsAtAsc(Instant from);
}
