package com.mallmind.backend.service;

import com.mallmind.backend.domain.entity.AuditLog;
import com.mallmind.backend.dto.admin.AuditLogResponse;
import com.mallmind.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actorEmail, String actorRole, String actionType,
                       String entityType, String entityId, String details, String status) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorEmail(actorEmail != null ? actorEmail : "anonymous")
                    .actorRole(actorRole != null ? actorRole : "UNKNOWN")
                    .actionType(actionType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .status(status != null ? status : "SUCCESS")
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to persist audit log: {} for entity {}", actionType, entityId, e);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> listLogs(String actionType, String entityType, int page, int size) {
        String act = (actionType != null && !actionType.isBlank()) ? actionType : null;
        String ent = (entityType != null && !entityType.isBlank()) ? entityType : null;
        return auditLogRepository.findFiltered(act, ent, PageRequest.of(page, size)).stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return new AuditLogResponse(
                a.getId(),
                a.getActorEmail(),
                a.getActorRole(),
                a.getActionType(),
                a.getEntityType(),
                a.getEntityId(),
                a.getDetails(),
                a.getStatus(),
                a.getCreatedAt());
    }
}
