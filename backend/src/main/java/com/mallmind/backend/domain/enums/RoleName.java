package com.mallmind.backend.domain.enums;

/**
 * The three user roles described in the MallMind AI product spec (Part 2):
 * visitors, retailers and mall administrators. Role-based access control is
 * enforced in Spring Security using these as authorities (prefixed ROLE_).
 */
public enum RoleName {
    ADMIN,
    RETAILER,
    VISITOR
}
