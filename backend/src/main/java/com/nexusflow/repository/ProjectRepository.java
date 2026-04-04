package com.nexusflow.repository;

import com.nexusflow.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Page<Project> findByCreatedById(Long userId, Pageable pageable);

    List<Project> findAllByCreatedById(Long userId);

    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN p.createdBy u " +
           "LEFT JOIN u.manager m " +
           "LEFT JOIN p.assignedTeam t " +
           "LEFT JOIN t.manager tm " +
           "WHERE m.id = :managerId " +
           "OR u.id IN (SELECT utm.id FROM Team team JOIN team.members utm WHERE team.manager.id = :managerId) " +
           "OR tm.id = :managerId " +
           "OR u.id = :managerId")
    Page<Project> findByCreatedByManagerId(@Param("managerId") Long managerId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN p.createdBy u " +
           "LEFT JOIN u.manager m " +
           "LEFT JOIN p.assignedTeam t " +
           "LEFT JOIN t.manager tm " +
           "WHERE m.id = :managerId " +
           "OR u.id IN (SELECT utm.id FROM Team team JOIN team.members utm WHERE team.manager.id = :managerId) " +
           "OR tm.id = :managerId " +
           "OR u.id = :managerId")
    List<Project> findAllByCreatedByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT p FROM Project p LEFT JOIN p.assignedTeam t LEFT JOIN t.members m WHERE p.createdBy.id = :userId OR m.id = :userId")
    Page<Project> findByCreatedByIdOrTeamMemberId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.assignedTeam t LEFT JOIN t.members m WHERE p.createdBy.id = :userId OR m.id = :userId")
    List<Project> findAllByCreatedByIdOrTeamMemberId(@Param("userId") Long userId);

    Optional<Project> findByIdAndCreatedById(Long projectId, Long userId);

    long countByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT p FROM Project p WHERE p.createdAt >= :yearStart")
    List<Project> findAllFromYearStart(@Param("yearStart") LocalDateTime yearStart);

    @Query("SELECT p FROM Project p WHERE p.progress = 100 AND p.updatedAt >= :yearStart")
    List<Project> findAllApprovedFromYearStart(@Param("yearStart") LocalDateTime yearStart);

    @Query("SELECT FUNCTION('MONTH', p.createdAt) as month, COUNT(p) as count FROM Project p " +
           "LEFT JOIN p.createdBy u " +
           "LEFT JOIN u.manager m " +
           "LEFT JOIN p.assignedTeam t " +
           "LEFT JOIN t.manager tm " +
           "WHERE (m.id = :managerId OR tm.id = :managerId) " +
           "AND p.createdAt BETWEEN :start AND :end " +
           "GROUP BY month")
    List<Object[]> getMonthlyProjectCountsByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('MONTH', p.updatedAt) as month, COUNT(p) as count FROM Project p " +
           "LEFT JOIN p.createdBy u " +
           "LEFT JOIN u.manager m " +
           "LEFT JOIN p.assignedTeam t " +
           "LEFT JOIN t.manager tm " +
           "WHERE (m.id = :managerId OR tm.id = :managerId) " +
           "AND p.progress = 100 " +
           "AND p.updatedAt BETWEEN :start AND :end " +
           "GROUP BY month")
    List<Object[]> getMonthlyApprovalCountsByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(p) FROM Project p " +
           "LEFT JOIN p.createdBy u " +
           "LEFT JOIN u.manager m " +
           "LEFT JOIN p.assignedTeam t " +
           "LEFT JOIN t.manager tm " +
           "WHERE (m.id = :managerId OR tm.id = :managerId) " +
           "AND p.createdAt BETWEEN :start AND :end")
    long countByManagerAndRange(
            @Param("managerId") Long managerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('MONTH', p.createdAt) as month, COUNT(p) as count FROM Project p " +
           "WHERE p.createdBy.id = :userId " +
           "AND p.createdAt BETWEEN :since AND :now " +
           "GROUP BY month")
    List<Object[]> getMonthlyProjectCountsByCreatedByIdAndRange(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since,
            @Param("now") LocalDateTime now);
}
