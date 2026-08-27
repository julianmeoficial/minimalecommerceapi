package com.minimalecommerce.identity.api;

import com.minimalecommerce.identity.api.dto.AddressRequest;
import com.minimalecommerce.identity.api.dto.AddressResponse;
import com.minimalecommerce.identity.application.AddressService;
import com.minimalecommerce.shared.security.AuthPrincipal;
import com.minimalecommerce.shared.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressResponse> list(@CurrentUser AuthPrincipal principal) {
        return addressService.list(principal.userId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(@CurrentUser AuthPrincipal principal,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.create(principal.userId(), request);
    }

    @PutMapping("/{id}")
    public AddressResponse update(@CurrentUser AuthPrincipal principal,
                                  @PathVariable UUID id,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(principal.userId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser AuthPrincipal principal, @PathVariable UUID id) {
        addressService.delete(principal.userId(), id);
    }
}
