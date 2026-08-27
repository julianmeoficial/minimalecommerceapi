package com.minimalecommerce.identity.api.dto;

import com.minimalecommerce.identity.domain.Address;

import java.util.UUID;

public record AddressResponse(
        UUID id,
        String label,
        String fullAddress,
        String city,
        String postalCode,
        String phone,
        boolean primaryAddress
) {
    public static AddressResponse from(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getLabel(),
                address.getFullAddress(),
                address.getCity(),
                address.getPostalCode(),
                address.getPhone(),
                address.isPrimaryAddress()
        );
    }
}
