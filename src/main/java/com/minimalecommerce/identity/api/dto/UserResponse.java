package com.minimalecommerce.identity.api.dto;

import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.identity.domain.UserRole;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        String phone,
        UserRole role,
        boolean active
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isActive()
        );
    }
}
