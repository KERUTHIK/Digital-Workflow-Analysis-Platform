package com.nexusflow.repository;

import com.nexusflow.entity.Role;
import com.nexusflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Returns all EMPLOYEE users whose manager_id = managerId OR who are members of a team managed by managerId.
     */
    @Query("SELECT DISTINCT u FROM User u WHERE u.manager.id = :managerId OR u.id IN (SELECT m.id FROM Team t JOIN t.members m WHERE t.manager.id = :managerId)")
    List<User> findByManagerIdOrTeamManagerId(@Param("managerId") Long managerId);

    /** Simple manager_id FK lookup — direct reports only. */
    @Query("SELECT u FROM User u WHERE u.manager.id = :managerId")
    List<User> findByManagerId(@Param("managerId") Long managerId);

    /** All users with the given role. */
    List<User> findByRole(Role role);
}
