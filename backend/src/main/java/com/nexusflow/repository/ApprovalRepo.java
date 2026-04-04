package com.nexusflow.repository;

import com.nexusflow.entity.Approval;
import com.nexusflow.entity.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRepo extends JpaRepository<Approval, Long> {

    @Query("SELECT a FROM Approval a JOIN FETCH a.reviewer JOIN FETCH a.project WHERE a.status IN ('APPROVED','REJECTED') AND a.actionTime BETWEEN :start AND :end")
    List<Approval> findCompletedApprovals(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Approval a WHERE a.reviewer.id = :managerId AND a.status = 'APPROVED' AND a.actionTime BETWEEN :start AND :end")
    long countApprovedByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Approval a WHERE a.reviewer.id = :managerId AND a.status = 'REJECTED' AND a.actionTime BETWEEN :start AND :end")
    long countRejectedByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(FUNCTION('TIMESTAMPDIFF', HOUR, a.createdAt, a.actionTime)) FROM Approval a WHERE a.reviewer.id = :managerId AND a.status = 'APPROVED' AND a.actionTime BETWEEN :start AND :end")
    Double getAvgApprovalHoursByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT a.status, COUNT(a) FROM Approval a WHERE a.reviewer.id = :managerId AND a.actionTime BETWEEN :start AND :end AND a.slaDeadline < :now GROUP BY a.status")
    List<Object[]> getSlaBreachTrendByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("now") LocalDateTime now);

    List<Approval> findByProjectId(Long projectId);

    @Query("SELECT a FROM Approval a WHERE a.reviewer.id = :reviewerId AND a.status = :status")
    List<Approval> findByReviewerIdAndStatus(
            @Param("reviewerId") Long reviewerId,
            @Param("status") ApprovalStatus status);

    Optional<Approval> findByProjectIdAndStatus(Long projectId, ApprovalStatus status);

    @Query("SELECT a FROM Approval a WHERE a.project.assignedTeam.manager.id = :managerId AND a.status = 'PENDING'")
    List<Approval> findPendingApprovalsByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT a FROM Approval a JOIN FETCH a.project JOIN FETCH a.reviewer WHERE a.status = 'PENDING' AND a.slaDeadline < :now")
    List<Approval> findBreachedApprovals(@Param("now") LocalDateTime now);

    @Query("SELECT FUNCTION('MONTH', a.actionTime), COUNT(a) FROM Approval a " +
           "WHERE a.actionTime >= :since AND a.slaDeadline < a.actionTime " +
           "GROUP BY FUNCTION('MONTH', a.actionTime)")
    List<Object[]> getGlobalSlaBreachTrend(@Param("since") LocalDateTime since);

    @Query("SELECT AVG(FUNCTION('TIMESTAMPDIFF', HOUR, a.createdAt, a.actionTime)) FROM Approval a WHERE a.status IN ('APPROVED', 'REJECTED')")
    Double getGlobalAvgApprovalHours();

    @Query("SELECT COUNT(a) FROM Approval a WHERE a.status IN ('APPROVED', 'REJECTED') AND (a.actionTime <= a.slaDeadline)")
    long countOnTimeApprovals();

    @Query("SELECT COUNT(a) FROM Approval a WHERE a.status IN ('APPROVED', 'REJECTED')")
    long countCompletedApprovals();

    @Query("SELECT AVG(FUNCTION('TIMESTAMPDIFF', HOUR, p.createdAt, a.actionTime)) " +
           "FROM Approval a JOIN a.project p " +
           "WHERE p.createdBy.id = :userId AND a.status IN ('APPROVED', 'REJECTED')")
    Double getAvgApprovalHoursByProjectCreator(@Param("userId") Long userId);

    @Query("SELECT FUNCTION('MONTH', a.actionTime), COUNT(a) FROM Approval a " +
           "JOIN a.project p " +
           "WHERE p.createdBy.id = :userId " +
           "AND a.status = 'APPROVED' " +
           "AND a.actionTime BETWEEN :since AND :now " +
           "GROUP BY FUNCTION('MONTH', a.actionTime)")
    List<Object[]> getMonthlyApprovedProjectCountsByCreatorAndRange(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since,
            @Param("now") LocalDateTime now);
}
