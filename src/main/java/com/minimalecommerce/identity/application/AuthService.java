package com.minimalecommerce.identity.application;

import com.minimalecommerce.identity.api.dto.AuthResponse;
import com.minimalecommerce.identity.api.dto.LoginRequest;
import com.minimalecommerce.identity.api.dto.RegisterRequest;
import com.minimalecommerce.identity.api.dto.UserResponse;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.identity.infrastructure.UserRepository;
import com.minimalecommerce.shared.domain.ConflictException;
import com.minimalecommerce.shared.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("EMAIL_TAKEN", "Ya existe una cuenta con ese email");
        }
        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRole(request.role());
        users.save(user);
        String token = jwtService.issue(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token, UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email())
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("invalid"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("invalid");
        }
        String token = jwtService.issue(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token, UserResponse.from(user));
    }
}
