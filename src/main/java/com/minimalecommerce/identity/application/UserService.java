package com.minimalecommerce.identity.application;

import com.minimalecommerce.identity.api.dto.UpdateProfileRequest;
import com.minimalecommerce.identity.api.dto.UserResponse;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.identity.infrastructure.UserRepository;
import com.minimalecommerce.shared.domain.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public User require(UUID id) {
        return users.findById(id).filter(User::isActive)
                .orElseThrow(() -> new NotFoundException("usuario", id));
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID id) {
        return UserResponse.from(require(id));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateProfileRequest request) {
        User user = require(id);
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        return UserResponse.from(user);
    }
}
