package com.minimalecommerce.identity.infrastructure;

import com.minimalecommerce.identity.domain.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findByUserIdAndActiveTrueOrderByPrimaryAddressDescCreatedAtDesc(UUID userId);

    Optional<Address> findByIdAndUserId(UUID id, UUID userId);

    Optional<Address> findByUserIdAndPrimaryAddressTrueAndActiveTrue(UUID userId);
}
