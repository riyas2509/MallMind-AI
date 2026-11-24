package com.mallmind.backend.exception;

/** Thrown when a RETAILER tries to manage a shop/product they do not own. ADMIN bypasses this check entirely. */
public class ShopOwnershipException extends RuntimeException {
    public ShopOwnershipException(String message) {
        super(message);
    }
}
