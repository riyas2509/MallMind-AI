package com.mallmind.backend.exception;

/** Thrown when the Python model-service (Part 3.3/Part 10) can't be reached
 * or returns an error, e.g. during a voice query. The caller must degrade
 * gracefully instead of crashing -- the rest of the platform (plain text
 * search, navigation, catalogue) has no dependency on this service. */
public class ModelServiceUnavailableException extends RuntimeException {
    public ModelServiceUnavailableException(String message) {
        super(message);
    }

    public ModelServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
