package com.nexusflow.repository;

import com.nexusflow.entity.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    @Query("SELECT t FROM TaskAssignment t JOIN FETCH t.assignedTo JOIN FETCH t.project WHERE t.project.id = :projectId ORDER BY t.createdAt ASC")
    List<TaskAssignment> findByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT t FROM TaskAssignment t JOIN FETCH t.assignedTo JOIN FETCH t.project WHERE t.assignedTo.id = :userId ORDER BY t.createdAt DESC")
    List<TaskAssignment> findByAssignedToId(@Param("userId") Long userId);

    void deleteByProjectId(Long projectId);

    // Delete only non-completed tasks so approved work is preserved on re-save
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM TaskAssignment t WHERE t.project.id = :projectId AND t.status <> 'COMPLETED'")
    void deleteNonCompletedByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT t FROM TaskAssignment t JOIN FETCH t.assignedTo JOIN FETCH t.project WHERE t.assignedByManagerId = :managerId ORDER BY t.createdAt ASC")
    List<TaskAssignment> findAllByAssignedByManagerId(@Param("managerId") Long managerId);

    /** Returns tasks currently awaiting manager review (any phase review status) */
    @Query("SELECT t FROM TaskAssignment t JOIN FETCH t.assignedTo JOIN FETCH t.project " +
           "WHERE t.assignedByManagerId = :managerId " +
           "AND t.status IN ('PHASE1_REVIEW', 'PHASE2_REVIEW', 'PHASE3_REVIEW') " +
           "ORDER BY t.submittedAt DESC")
    List<TaskAssignment> findPhaseReviewsByManagerId(@Param("managerId") Long managerId);

    /** Legacy alias kept for backward compat */
    default List<TaskAssignment> findPendingReviewsByManagerId(Long managerId) {
        return findPhaseReviewsByManagerId(managerId);
    }

    @Query("SELECT MONTH(t.submittedAt), COUNT(t) FROM TaskAssignment t " +
           "WHERE t.assignedTo.id = :userId " +
           "AND t.submittedAt BETWEEN :start AND :end " +
           "AND t.submittedAt IS NOT NULL " +
           "GROUP BY MONTH(t.submittedAt)")
    List<Object[]> getMonthlyTaskCountsByAssignedToIdAndRange(
            @Param("userId") Long userId,
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);
}
