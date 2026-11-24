package com.mallmind.backend.exception;

/** Thrown when the model-service has no simulated demand history for a
 * category name (model-service returns 404) -- distinct from the service
 * simply being unreachable, so the caller gets an honest "no such
 * category" instead of a misleading "service unavailable". */
public class DemandCategoryNotFoundException extends RuntimeException {
    public DemandCategoryNotFoundException(String category) {
        super("No demand forecast available for category '" + category + "'");
    }
}
