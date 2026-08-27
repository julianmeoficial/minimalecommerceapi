package com.minimalecommerce.engagement.api;

import com.minimalecommerce.engagement.api.dto.FavoriteResponse;
import com.minimalecommerce.engagement.application.FavoriteService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteResponse> list(@CurrentUser AuthPrincipal principal) {
        return favoriteService.list(principal.userId());
    }

    @PostMapping("/{productId}/toggle")
    public FavoriteResponse toggle(@CurrentUser AuthPrincipal principal, @PathVariable UUID productId) {
        return favoriteService.toggle(principal.userId(), productId);
    }

    @PutMapping("/{productId}/notify-stock")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void notifyStock(@CurrentUser AuthPrincipal principal,
                            @PathVariable UUID productId,
                            @RequestParam boolean enabled) {
        favoriteService.notifyStock(principal.userId(), productId, enabled);
    }
}
