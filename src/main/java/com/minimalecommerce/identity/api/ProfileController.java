package com.minimalecommerce.identity.api;

import com.minimalecommerce.identity.api.dto.UpdateProfileRequest;
import com.minimalecommerce.identity.api.dto.UserResponse;
import com.minimalecommerce.identity.application.UserService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserResponse me(@CurrentUser AuthPrincipal principal) {
        return userService.me(principal.userId());
    }

    @PutMapping
    public UserResponse update(@CurrentUser AuthPrincipal principal,
                               @Valid @RequestBody UpdateProfileRequest request) {
        return userService.update(principal.userId(), request);
    }
}
