package com.minimalecommerce.engagement.application;

import com.minimalecommerce.catalog.application.CatalogStockPort;
import com.minimalecommerce.engagement.api.dto.FavoriteResponse;
import com.minimalecommerce.engagement.domain.Favorite;
import com.minimalecommerce.engagement.infrastructure.FavoriteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FavoriteService {

    private final FavoriteRepository favorites;
    private final CatalogStockPort catalog;

    public FavoriteService(FavoriteRepository favorites, CatalogStockPort catalog) {
        this.favorites = favorites;
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> list(UUID userId) {
        return favorites.findByUserIdOrderByCreatedAtDesc(userId).stream().map(FavoriteResponse::from).toList();
    }

    @Transactional
    public FavoriteResponse toggle(UUID userId, UUID productId) {
        catalog.requireActive(productId);
        var existing = favorites.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            favorites.delete(existing.get());
            return null;
        }
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setProductId(productId);
        favorites.save(favorite);
        return FavoriteResponse.from(favorite);
    }

    @Transactional
    public FavoriteResponse notifyStock(UUID userId, UUID productId, boolean notify) {
        Favorite favorite = favorites.findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> {
                    catalog.requireActive(productId);
                    Favorite created = new Favorite();
                    created.setUserId(userId);
                    created.setProductId(productId);
                    return favorites.save(created);
                });
        favorite.setNotifyStock(notify);
        return FavoriteResponse.from(favorite);
    }
}
