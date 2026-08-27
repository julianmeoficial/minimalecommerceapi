package com.minimalecommerce.shared.domain;

public class NotFoundException extends BusinessException {

    public NotFoundException(String resource, Object id) {
        super("NOT_FOUND", resource + " no encontrado: " + id);
    }

    public NotFoundException(String message) {
        super("NOT_FOUND", message);
    }
}
