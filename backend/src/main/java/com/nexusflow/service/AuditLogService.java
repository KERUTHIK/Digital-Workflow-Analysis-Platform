package com.nexusflow.service;

import com.nexusflow.entity.AuditLog;
import com.nexusflow.entity.Project;
import com.nexusflow.entity.User;
import com.nexusflow.repository.AuditLogRepository;
import com.nexusflow.repository.UserRepository;
import com.nexusflow.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records audit events for every project status transition.
 * Always runs in its own transaction (REQUIRES_NEW) so logs
 * are persisted even if the outer transaction rolls back.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Writes a single audit log entry.
     *
     * @param userId    the actor's user ID
     * @param action    human-readable action label (e.g., "PROJECT_APPROVED")
     * @param project   the project being acted upon
     * @param oldStatus previous project status (nullable)
     * @param newStatus new project status
     */
    @Transactional
    public void log(Long userId, String action, Project project, String oldStatus, String newStatus) {
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        AuditLog entry = AuditLog.builder()
                .user(actor)
                .action(action)
                .project(project)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .build();

        auditLogRepository.save(entry);
        log.debug("Audit log created: action={}, project={}, old={}, new={}", action,
                project != null ? project.getId() : "N/A", oldStatus, newStatus);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AuditLog> getAllAuditLogs(org.springframework.data.domain.Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
