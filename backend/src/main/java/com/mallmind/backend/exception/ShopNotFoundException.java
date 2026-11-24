package com.mallmind.backend.exception;

public class ShopNotFoundException extends RuntimeException {
    public ShopNotFoundException(Long id) {
        super("No shop found with id " + id);
    }

    public ShopNotFoundException(String message) {
        super(message);
    }
}
