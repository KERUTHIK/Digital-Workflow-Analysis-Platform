package com.nexusflow.repository;

import com.nexusflow.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByProjectId(Long projectId);

    List<AuditLog> findByProjectIdOrderByTimestampDesc(Long projectId);

    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
}
