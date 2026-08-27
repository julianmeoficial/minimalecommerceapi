package com.minimalecommerce.shared.security;

import com.minimalecommerce.identity.domain.UserRole;

import java.util.UUID;

public record AuthPrincipal(UUID userId, String email, UserRole role) {
}
