package com.nexusflow.config;

import com.nexusflow.entity.*;
import com.nexusflow.repository.ApprovalRepo;
import com.nexusflow.repository.ProjectRepository;
import com.nexusflow.repository.TeamRepository;
import com.nexusflow.repository.UserRepository;
import com.nexusflow.repository.WorkflowTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ProjectRepository projRepo;
    private final ApprovalRepo approvalRepo;
    private final WorkflowTemplateRepository workflowTemplateRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataSeeder(UserRepository userRepository,
                      ProjectRepository projRepo,
                      ApprovalRepo approvalRepo,
                      WorkflowTemplateRepository workflowTemplateRepository,
                      TeamRepository teamRepository,
                      PasswordEncoder passwordEncoder,
                      JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.projRepo = projRepo;
        this.approvalRepo = approvalRepo;
        this.workflowTemplateRepository = workflowTemplateRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (this.projRepo.count() < 3) {
            seedData();
        }
        updateApprovedProjectsProgress();
        repairDemoEmployeeAccess();
    }

    private void updateApprovedProjectsProgress() {
        log.info("Updating progress for already approved projects...");
        this.jdbcTemplate.update(
            "UPDATE projects SET progress = 100 WHERE id IN (SELECT a.project_id FROM approvals a WHERE a.status = 'APPROVED')"
        );
    }

    private void repairDemoEmployeeAccess() {
        User kishore = this.userRepository.findByEmail("kishore@gmail.com").orElse(null);
        if (kishore == null) {
            return;
        }

        User sarah = this.userRepository.findByEmail("sarah@gmail.com")
                .or(() -> this.userRepository.findByEmail("sarah.jenkins@nexusflow.io"))
                .orElse(null);
        if (sarah == null) {
            return;
        }

        if (kishore.getManager() == null || !sarah.getId().equals(kishore.getManager().getId())) {
            kishore.setManager(sarah);
            this.userRepository.save(kishore);
        }

        Team team = this.teamRepository.findByName("Engineering Alpha")
                .orElseGet(() -> {
                    List<Team> teams = this.teamRepository.findByManagerId(sarah.getId());
                    return teams.isEmpty() ? null : teams.get(0);
                });

        if (team == null) {
            return;
        }

        if (!team.getMembers().stream().anyMatch(member -> member.getId().equals(kishore.getId()))) {
            team.getMembers().add(kishore);
            this.teamRepository.save(team);
        }
    }

    private void seedData() {
        log.info("Starting database seeding for analytics...");

        if (this.userRepository.findByEmail("admin@nexusflow.com").isPresent()) {
            log.info("Users already seeded, skipping user creation.");
        } else {
            createUser("keruthik", "admin@nexusflow.com", "password123", Role.ADMIN, null, "IT Ops");
        }

        User manager1 = this.userRepository.findByEmail("sarah.jenkins@nexusflow.io")
                .orElseGet(() -> createUser("Sarah Jenkins", "sarah.jenkins@nexusflow.io", "Manager@123", Role.MANAGER, null, "Innovation"));
        User manager2 = this.userRepository.findByEmail("james.mitchell@nexusflow.io")
                .orElseGet(() -> createUser("James Mitchell", "james.mitchell@nexusflow.io", "Manager@123", Role.MANAGER, null, "IT Ops"));
        User manager3 = this.userRepository.findByEmail("robert.frost@nexusflow.io")
                .orElseGet(() -> createUser("Robert Frost", "robert.frost@nexusflow.io", "Manager@123", Role.MANAGER, null, "Finance"));
        
        User employee1 = this.userRepository.findByEmail("emily.clarke@nexusflow.io")
                .orElseGet(() -> createUser("Emily Clarke", "emily.clarke@nexusflow.io", "Employee@123", Role.EMPLOYEE, manager1, "Innovation"));
        User employee2 = this.userRepository.findByEmail("michael.chen@nexusflow.io")
                .orElseGet(() -> createUser("Michael Chen", "michael.chen@nexusflow.io", "Employee@123", Role.EMPLOYEE, manager2, "IT Ops"));
        User employee3 = this.userRepository.findByEmail("david.miller@nexusflow.io")
                .orElseGet(() -> createUser("David Miller", "david.miller@nexusflow.io", "Employee@123", Role.EMPLOYEE, manager3, "Finance"));

        Team team1 = this.teamRepository.findByName("AI/ML")
                .orElseGet(() -> createTeam("AI/ML", "Innovation", "#6366f1", "Core AI Development", manager1, List.of(employee1, employee2)));
        Team team2 = this.teamRepository.findByName("Cloud Systems")
                .orElseGet(() -> createTeam("Cloud Systems", "IT Ops", "#ec4899", "Cloud Infrastructure", manager2, List.of(employee2)));
        Team team3 = this.teamRepository.findByName("FinTech Core")
                .orElseGet(() -> createTeam("FinTech Core", "Finance", "#10b981", "Financial systems", manager3, List.of(employee3)));

        LocalDateTime now = LocalDateTime.now();
        
        Project p_old1 = createProject("Legacy Migration", "OldCorp", 200000.0, 100, employee2, team2, now.minusMonths(5));
        createCompletedApproval(p_old1, manager2, ApprovalStatus.APPROVED, p_old1.getCreatedAt().plusHours(36));

        Project p_old2 = createProject("Security Audit Q4", "Internal", 20000.0, 100, employee2, team2, now.minusMonths(4));
        createCompletedApproval(p_old2, manager2, ApprovalStatus.APPROVED, p_old2.getCreatedAt().plusHours(12));

        Project p_old3 = createProject("Database Optimization", "Internal", 35000.0, 100, employee2, team2, now.minusMonths(3));
        createCompletedApproval(p_old3, manager2, ApprovalStatus.APPROVED, p_old3.getCreatedAt().plusHours(24));
        
        Project p_old4 = createProject("Frontend Refresh", "Acme", 45000.0, 20, employee1, team1, now.minusMonths(3));
        createCompletedApproval(p_old4, manager1, ApprovalStatus.REJECTED, p_old4.getCreatedAt().plusHours(48));

        Project p1 = createProject("Cloud Migration Phase 1", "Acme", 100000.0, 100, employee1, team2, now.minusMonths(2));
        createCompletedApproval(p1, manager1, ApprovalStatus.APPROVED, p1.getCreatedAt().plusHours(4));
        
        Project p4 = createProject("Data Warehouse", "Global Finance", 250000.0, 100, employee2, team1, now.minusMonths(2));
        createCompletedApproval(p4, manager1, ApprovalStatus.APPROVED, p4.getCreatedAt().plusHours(24));

        Project p2 = createProject("Mobile UI Refresh", "TechNova", 50000.0, 100, employee1, team1, now.minusMonths(1));
        createCompletedApproval(p2, manager1, ApprovalStatus.APPROVED, p2.getCreatedAt().plusHours(12));
        
        Project p5 = createProject("Security Audit", "Internal", 15000.0, 10, employee3, team3, now.minusMonths(1));
        createCompletedApproval(p5, manager3, ApprovalStatus.REJECTED, p5.getCreatedAt().plusHours(52));

        Project p3 = createProject("CRM Integration", "TechNova", 75000.0, 60, employee1, team1, now.minusDays(5));
        Project p6 = createProject("API Gateway", "InterLink", 120000.0, 45, employee2, team2, now.minusDays(2));
        
        createBreach(p3, manager1, now.minusHours(12));
        createBreach(p6, manager2, now.minusHours(24));

        seedWorkflows();
        log.info("Database seeding completed.");
    }

    private Project createProject(String title, String client, double budget, int progress, User creator, Team team, LocalDateTime createdAt) {
        Project project = Project.builder()
                .title(title)
                .clientName(client)
                .budget(BigDecimal.valueOf(budget))
                .progress(progress)
                .createdBy(creator)
                .assignedTeam(team)
                .build();
        project.setCreatedAt(createdAt);
        project.setUpdatedAt(progress == 100 ? createdAt.plusHours(8) : createdAt);
        return this.projRepo.save(project);
    }

    private void createCompletedApproval(Project p, User reviewer, ApprovalStatus status, LocalDateTime actionTime) {
        Approval a = Approval.builder()
                .project(p)
                .reviewer(reviewer)
                .status(status)
                .slaDeadline(p.getCreatedAt().plusDays(2))
                .build();
        a.setCreatedAt(p.getCreatedAt());
        a.setActionTime(actionTime);
        this.approvalRepo.save(a);
    }

    private void createBreach(Project project, User reviewer, LocalDateTime deadline) {
        Approval approval = Approval.builder()
                .project(project)
                .reviewer(reviewer)
                .status(ApprovalStatus.PENDING)
                .slaDeadline(deadline)
                .build();
        approval.setCreatedAt(LocalDateTime.now().minusDays(3));
        this.approvalRepo.save(approval);
    }

    private User createUser(String name, String email, String password, Role role, User manager, String dept) {
        User user = User.builder()
                .name(name)
                .email(email)
                .password(this.passwordEncoder.encode(password))
                .role(role)
                .manager(manager)
                .department(dept)
                .active(true)
                .build();
        return this.userRepository.save(user);
    }

    private Team createTeam(String name, String dept, String color, String desc, User manager, List<User> members) {
        Team team = new Team();
        team.setName(name);
        team.setDepartment(dept);
        team.setColor(color);
        team.setDescription(desc);
        team.setManager(manager);
        team.setMembers(new HashSet<>(members));
        return this.teamRepository.save(team);
    }

    private void seedWorkflows() {
        if (this.workflowTemplateRepository.count() > 0) return;
        WorkflowTemplate itTemplate = new WorkflowTemplate();
        itTemplate.setName("Standard IT Project");
        itTemplate.setDescription("Default workflow for IT infrastructure.");
        itTemplate.setCreatedBy("Alex Morgan");
        itTemplate.setStatus("Active");
        itTemplate.setProjectCount(87);
        this.workflowTemplateRepository.save(itTemplate);
    }
}
