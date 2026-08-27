package com.minimalecommerce.ordering.application;

import com.minimalecommerce.catalog.application.CatalogStockPort;
import com.minimalecommerce.catalog.domain.Product;
import com.minimalecommerce.identity.application.UserService;
import com.minimalecommerce.identity.domain.UserRole;
import com.minimalecommerce.ordering.api.dto.PreorderRequest;
import com.minimalecommerce.ordering.api.dto.PreorderResponse;
import com.minimalecommerce.ordering.domain.Preorder;
import com.minimalecommerce.ordering.domain.PreorderStatus;
import com.minimalecommerce.ordering.infrastructure.PreorderRepository;
import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.ForbiddenException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.security.AuthPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PreorderService {

    private final PreorderRepository preorders;
    private final CatalogStockPort catalog;
    private final UserService users;

    public PreorderService(PreorderRepository preorders, CatalogStockPort catalog, UserService users) {
        this.preorders = preorders;
        this.catalog = catalog;
        this.users = users;
    }

    @Transactional
    public PreorderResponse create(UUID userId, PreorderRequest request) {
        Product product = catalog.requireActive(request.productId());
        if (!product.isPreorder()) {
            throw new BusinessException("NOT_PREORDER", "Este producto no admite preorden");
        }
        Preorder preorder = new Preorder();
        preorder.setUser(users.require(userId));
        preorder.setProduct(product);
        preorder.setQuantity(request.quantity());
        preorder.setPreorderPrice(product.getPrice());
        preorder.setNotes(request.notes());
        preorder.setEstimatedDelivery(request.estimatedDelivery());
        preorders.save(preorder);
        return PreorderResponse.from(preorder);
    }

    @Transactional(readOnly = true)
    public List<PreorderResponse> mine(UUID userId) {
        return preorders.findByUserIdOrderByCreatedAtDesc(userId).stream().map(PreorderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PreorderResponse> forSeller(UUID sellerId) {
        return preorders.findByProductSellerIdOrderByCreatedAtDesc(sellerId).stream().map(PreorderResponse::from).toList();
    }

    @Transactional
    public PreorderResponse updateStatus(AuthPrincipal principal, UUID id, PreorderStatus status) {
        if (principal.role() != UserRole.VENDEDOR) {
            throw new ForbiddenException("Solo el vendedor puede actualizar la preorden");
        }
        Preorder preorder = preorders.findById(id).orElseThrow(() -> new NotFoundException("preorden", id));
        if (!preorder.getProduct().getSeller().getId().equals(principal.userId())) {
            throw new ForbiddenException("Esta preorden no es de tu catálogo");
        }
        preorder.setStatus(status);
        return PreorderResponse.from(preorder);
    }

    @Transactional
    public PreorderResponse cancel(UUID userId, UUID id) {
        Preorder preorder = preorders.findById(id).orElseThrow(() -> new NotFoundException("preorden", id));
        if (!preorder.getUser().getId().equals(userId)) {
            throw new ForbiddenException("No puedes cancelar esta preorden");
        }
        if (preorder.getStatus() == PreorderStatus.ENTREGADA) {
            throw new BusinessException("NOT_CANCELLABLE", "La preorden ya fue entregada");
        }
        preorder.setStatus(PreorderStatus.CANCELADA);
        return PreorderResponse.from(preorder);
    }
}
