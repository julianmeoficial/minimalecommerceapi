package com.minimalecommerce.shared.security;

import com.minimalecommerce.identity.domain.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final AppProperties properties;

    public JwtService(AppProperties properties) {
        this.properties = properties;
    }

    public String issue(UUID userId, String email, UserRole role) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(properties.getJwt().getExpirationMs());
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key())
                .compact();
    }

    public AuthPrincipal parse(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return new AuthPrincipal(
                UUID.fromString(claims.getSubject()),
                claims.get("email", String.class),
                UserRole.valueOf(claims.get("role", String.class))
        );
    }

    private SecretKey key() {
        byte[] bytes = properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
        }
        return Keys.hmacShaKeyFor(bytes);
    }
}
