package com.minimalecommerce.shared.domain;

public class ConflictException extends BusinessException {

    public ConflictException(String code, String message) {
        super(code, message);
    }
}
