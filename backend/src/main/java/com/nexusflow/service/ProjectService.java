package com.nexusflow.service;

import com.nexusflow.dto.PagedResponse;
import com.nexusflow.dto.ProjectRequest;
import com.nexusflow.dto.ProjectResponse;
import com.nexusflow.entity.Project;
import com.nexusflow.entity.Role;
import com.nexusflow.entity.Team;
import com.nexusflow.entity.User;
import com.nexusflow.exception.BusinessException;
import com.nexusflow.exception.ResourceNotFoundException;
import com.nexusflow.repository.ProjectRepository;
import com.nexusflow.repository.TeamRepository;
import com.nexusflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Core project lifecycle management service.
 * Enforces ownership rules: employees can only touch their own projects.
 */
@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final AuditLogService auditLogService;
    private final ApprovalService approvalService;

    public ProjectService(ProjectRepository projectRepository,
                          UserRepository userRepository,
                          TeamRepository teamRepository,
                          AuditLogService auditLogService,
                          @org.springframework.context.annotation.Lazy ApprovalService approvalService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.auditLogService = auditLogService;
        this.approvalService = approvalService;
    }

    // ── Employee APIs ─────────────────────────────────────────────────────────

    /**
     * Creates a new project in DRAFT status. Sets createdBy = logged-in employee.
     */
    @Transactional
    public ProjectResponse createProject(ProjectRequest request, Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", employeeId));

        log.info("Creating project: title={}, employeeId={}, teamId={}", request.getTitle(), employeeId, request.getTeamId());
        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .clientName(request.getClientName())
                .budget(request.getBudget())
                .progress(request.getProgress() != null ? request.getProgress() : 0)
                .priority(request.getPriority() != null ? request.getPriority() : "Medium")
                .createdBy(employee)
                .build();

        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));
            project.setAssignedTeam(team);
        }

        Project saved = projectRepository.save(project);

        auditLogService.log(employeeId, "PROJECT_CREATED", saved, null, "0");
        log.info("Project created: id={}, title={}", saved.getId(), saved.getTitle());
        return ProjectResponse.from(saved);
    }

    /**
     * Retrieves all projects owned by the logged-in employee (paginated).
     */
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getMyProjects(Long employeeId, Pageable pageable) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", employeeId));

        Long managerId = employee.getManager() != null ? employee.getManager().getId() : employeeId;
        Page<ProjectResponse> page = projectRepository
                .findByCreatedByManagerId(managerId, pageable)
                .map(ProjectResponse::from);
        return PagedResponse.from(page);
    }

    @Transactional(readOnly = true)
    public java.util.List<Project> getVisibleProjects(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", employeeId));

        Long managerId = employee.getManager() != null ? employee.getManager().getId() : employeeId;
        return projectRepository.findAllByCreatedByManagerId(managerId);
    }

    /**
     * Updates a project. Only the owner can update, and only DRAFT/REJECTED projects.
     */
    @Transactional
    public ProjectResponse updateProject(Long projectId, ProjectRequest request, Long employeeId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", employeeId));

        log.info("Updating project: id={}, employeeId={}, teamId={}", projectId, employeeId, request.getTeamId());
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        log.info("Found project for update: id={}", project.getId());

        // Allow owner OR Admin OR Team Member to update
        boolean isOwner = project.getCreatedBy().getId().equals(employeeId);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isTeamMember = project.getAssignedTeam() != null && 
                               project.getAssignedTeam().getMembers().stream()
                                      .anyMatch(m -> m.getId().equals(employeeId));

        if (!isOwner && !isAdmin && !isTeamMember) {
            throw new BusinessException("You don't have permission to update this project");
        }


        String oldProgress = String.valueOf(project.getProgress());

        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setClientName(request.getClientName());
        project.setBudget(request.getBudget());
        if (request.getProgress() != null) {
            project.setProgress(request.getProgress());
        }
        if (request.getPriority() != null) {
            project.setPriority(request.getPriority());
        }

        if (request.getTeamId() != null) {
            log.info("Assigning team: id={}", request.getTeamId());
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));
            log.info("Found team: name={}", team.getName());
            project.setAssignedTeam(team);
        } else {
            log.info("Clearing team assignment");
            project.setAssignedTeam(null);
        }

        Project updated = projectRepository.save(project);

        auditLogService.log(employeeId, "PROJECT_UPDATED", updated, oldProgress, String.valueOf(updated.getProgress()));
        return ProjectResponse.from(updated);
    }

    /**
     * Retrieves a single project by ID. Employee must be the owner.
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, Long employeeId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", employeeId));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        // Keep project-detail visibility aligned with the employee project list scope.
        boolean isOwner = project.getCreatedBy().getId().equals(employeeId);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isTeamMember = project.getAssignedTeam() != null && 
                               project.getAssignedTeam().getMembers().stream()
                                      .anyMatch(m -> m.getId().equals(employeeId));
        boolean isManager = project.getAssignedTeam() != null &&
                            project.getAssignedTeam().getManager().getId().equals(employeeId);
        boolean isVisibleToEmployeeScope = getVisibleProjects(employeeId).stream()
                .anyMatch(visibleProject -> visibleProject.getId().equals(projectId));

        if (!isOwner && !isAdmin && !isTeamMember && !isManager && !isVisibleToEmployeeScope) {
            throw new BusinessException("You don't have permission to view this project");
        }
        return ProjectResponse.from(project);
    }

    /**
     * Submits a project for manager approval.
     */
    @Transactional
    public ProjectResponse submitProject(Long projectId, Long employeeId) {
        Project project = getProjectEntityById(projectId);
        
        if (!project.getCreatedBy().getId().equals(employeeId)) {
            throw new BusinessException("You don't have permission to submit this project");
        }
        
        User reviewer = project.getAssignedTeam() != null ? project.getAssignedTeam().getManager() : project.getCreatedBy().getManager();
        if (reviewer == null) {
            throw new BusinessException("No manager found to approve this project");
        }

        approvalService.createPendingApproval(project, reviewer);
        
        // Audit log
        auditLogService.log(employeeId, "PROJECT_SUBMITTED", project, null, null);
        
        return ProjectResponse.from(project);
    }

    // ── Admin APIs ────────────────────────────────────────────────────────────

    /**
     * Returns all projects in the system (paginated) – Admin only.
     */
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getAllProjects(Pageable pageable) {
        Page<ProjectResponse> page = projectRepository.findAll(pageable).map(ProjectResponse::from);
        return PagedResponse.from(page);
    }

    // ── Manager APIs ──────────────────────────────────────────────────────────

    /**
     * Returns projects belonging to employees in the manager's team (paginated).
     */
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getTeamProjects(Long managerId, Pageable pageable) {
        Page<ProjectResponse> page = projectRepository
                .findByCreatedByManagerId(managerId, pageable)
                .map(ProjectResponse::from);
        return PagedResponse.from(page);
    }

    // ── Shared helper ─────────────────────────────────────────────────────────

    /**
     * Loads a project by ID (no ownership check) for internal use.
     */
    @Transactional(readOnly = true)
    public Project getProjectEntityById(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

}
