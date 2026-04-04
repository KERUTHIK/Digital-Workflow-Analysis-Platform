package com.nexusflow.repository;

import com.nexusflow.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByDepartment(String department);
    List<Team> findByManagerId(Long managerId);
    Optional<Team> findByName(String name);
}
