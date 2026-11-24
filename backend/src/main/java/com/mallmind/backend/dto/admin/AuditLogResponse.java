package com.mallmind.backend.dto.admin;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        String actorEmail,
        String actorRole,
        String actionType,
        String entityType,
        String entityId,
        String details,
        String status,
        Instant createdAt
) {}
