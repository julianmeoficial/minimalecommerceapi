package com.minimalecommerce.identity.application;

import com.minimalecommerce.identity.api.dto.AddressRequest;
import com.minimalecommerce.identity.api.dto.AddressResponse;
import com.minimalecommerce.identity.domain.Address;
import com.minimalecommerce.identity.domain.User;
import com.minimalecommerce.identity.infrastructure.AddressRepository;
import com.minimalecommerce.shared.domain.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AddressService {

    private final AddressRepository addresses;
    private final UserService users;

    public AddressService(AddressRepository addresses, UserService users) {
        this.addresses = addresses;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> list(UUID userId) {
        return addresses.findByUserIdAndActiveTrueOrderByPrimaryAddressDescCreatedAtDesc(userId)
                .stream().map(AddressResponse::from).toList();
    }

    @Transactional
    public AddressResponse create(UUID userId, AddressRequest request) {
        User user = users.require(userId);
        Address address = new Address();
        address.setUser(user);
        apply(address, request);
        if (request.primaryAddress()) {
            clearPrimary(userId);
        }
        addresses.save(address);
        return AddressResponse.from(address);
    }

    @Transactional
    public AddressResponse update(UUID userId, UUID addressId, AddressRequest request) {
        Address address = owned(userId, addressId);
        apply(address, request);
        if (request.primaryAddress()) {
            clearPrimary(userId);
            address.setPrimaryAddress(true);
        }
        return AddressResponse.from(address);
    }

    @Transactional
    public void delete(UUID userId, UUID addressId) {
        Address address = owned(userId, addressId);
        address.setActive(false);
        address.setPrimaryAddress(false);
    }

    @Transactional(readOnly = true)
    public Address requireOwned(UUID userId, UUID addressId) {
        return owned(userId, addressId);
    }

    private Address owned(UUID userId, UUID addressId) {
        return addresses.findByIdAndUserId(addressId, userId)
                .filter(Address::isActive)
                .orElseThrow(() -> new NotFoundException("dirección", addressId));
    }

    private void apply(Address address, AddressRequest request) {
        address.setLabel(request.label());
        address.setFullAddress(request.fullAddress());
        address.setCity(request.city());
        address.setPostalCode(request.postalCode());
        address.setPhone(request.phone());
        address.setPrimaryAddress(request.primaryAddress());
    }

    private void clearPrimary(UUID userId) {
        addresses.findByUserIdAndPrimaryAddressTrueAndActiveTrue(userId)
                .ifPresent(existing -> existing.setPrimaryAddress(false));
    }
}
