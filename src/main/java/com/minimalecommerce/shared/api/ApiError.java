package com.minimalecommerce.shared.api;

import java.time.Instant;
import java.util.List;

public record ApiError(
        String code,
        String message,
        List<String> details,
        Instant timestamp,
        String path
) {
    public static ApiError of(String code, String message, String path) {
        return new ApiError(code, message, List.of(), Instant.now(), path);
    }

    public static ApiError of(String code, String message, List<String> details, String path) {
        return new ApiError(code, message, details, Instant.now(), path);
    }
}
