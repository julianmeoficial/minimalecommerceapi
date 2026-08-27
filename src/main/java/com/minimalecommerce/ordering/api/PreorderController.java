package com.minimalecommerce.ordering.api;

import com.minimalecommerce.ordering.api.dto.PreorderRequest;
import com.minimalecommerce.ordering.api.dto.PreorderResponse;
import com.minimalecommerce.ordering.application.PreorderService;
import com.minimalecommerce.ordering.domain.PreorderStatus;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/preorders")
public class PreorderController {

    private final PreorderService preorderService;

    public PreorderController(PreorderService preorderService) {
        this.preorderService = preorderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PreorderResponse create(@CurrentUser AuthPrincipal principal,
                                   @Valid @RequestBody PreorderRequest request) {
        return preorderService.create(principal.userId(), request);
    }

    @GetMapping
    public List<PreorderResponse> mine(@CurrentUser AuthPrincipal principal) {
        return preorderService.mine(principal.userId());
    }

    @GetMapping("/sold")
    @PreAuthorize("hasRole('VENDEDOR')")
    public List<PreorderResponse> sold(@CurrentUser AuthPrincipal principal) {
        return preorderService.forSeller(principal.userId());
    }

    @PutMapping("/{id}/status")
    public PreorderResponse status(@CurrentUser AuthPrincipal principal,
                                   @PathVariable UUID id,
                                   @RequestBody Map<String, PreorderStatus> body) {
        return preorderService.updateStatus(principal, id, body.get("status"));
    }

    @PostMapping("/{id}/cancel")
    public PreorderResponse cancel(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        return preorderService.cancel(principal.userId(), id);
    }
}
