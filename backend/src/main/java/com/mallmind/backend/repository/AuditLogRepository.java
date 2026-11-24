package com.mallmind.backend.repository;

import com.mallmind.backend.domain.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE (:actionType IS NULL OR a.actionType = :actionType) " +
           "AND (:entityType IS NULL OR a.entityType = :entityType) " +
           "ORDER BY a.createdAt DESC")
    List<AuditLog> findFiltered(
            @Param("actionType") String actionType,
            @Param("entityType") String entityType,
            Pageable pageable);
}
