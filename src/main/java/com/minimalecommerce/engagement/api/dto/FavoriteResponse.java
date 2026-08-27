package com.minimalecommerce.engagement.api.dto;

import com.minimalecommerce.engagement.domain.Favorite;

import java.util.UUID;

public record FavoriteResponse(UUID id, UUID productId, boolean notifyStock) {
    public static FavoriteResponse from(Favorite favorite) {
        return new FavoriteResponse(favorite.getId(), favorite.getProductId(), favorite.isNotifyStock());
    }
}
