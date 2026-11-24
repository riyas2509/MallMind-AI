package com.mallmind.backend.exception;

/** Thrown by CatalogueImportService when a CSV catalogue file is malformed
 * or references a shop/category that does not exist. */
public class CatalogueImportException extends RuntimeException {
    public CatalogueImportException(String message, Throwable cause) {
        super(message, cause);
    }

    public CatalogueImportException(String message) {
        super(message);
    }
}
