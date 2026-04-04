package com.nexusflow.controller;

import com.nexusflow.dto.PagedResponse;
import com.nexusflow.dto.ProjectRequest;
import com.nexusflow.dto.ProjectResponse;
import com.nexusflow.dto.TaskAssignmentResponse;
import com.nexusflow.entity.TaskAssignment;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.repository.TaskAssignmentRepository;
import com.nexusflow.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Employee-only endpoints.
 * All operations are scoped to created_by = logged-in employee.
 */
@RestController
@RequestMapping("/api/employee")
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
public class EmployeeController {

    private final ProjectService projectService;
    private final TaskAssignmentRepository taskAssignmentRepository;

    public EmployeeController(ProjectService projectService,
                              TaskAssignmentRepository taskAssignmentRepository) {
        this.projectService = projectService;
        this.taskAssignmentRepository = taskAssignmentRepository;
    }

    /**
     * POST /api/employee/projects
     * Creates a new project in DRAFT status.
     */
    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User loggedInUser) {

        ProjectResponse response = projectService.createProject(request, loggedInUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Project created successfully"));
    }

    /**
     * GET /api/employee/my-projects?page=0&size=10
     * Returns all projects owned by the logged-in employee (paginated).
     */
    @GetMapping("/my-projects")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getMyProjects(
            @AuthenticationPrincipal User loggedInUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.success(
                projectService.getMyProjects(loggedInUser.getId(), pageable),
                "Projects retrieved successfully"));
    }

    /**
     * GET /api/employee/projects/task-stats
     * Returns project-wide task completion counts for projects visible to the logged-in employee:
     *   { projectId: { total, completed, underReview, pending } }
     */
    @GetMapping("/projects/task-stats")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.Map<Long, java.util.Map<String, Integer>>>> getProjectTaskStats(
            @AuthenticationPrincipal User loggedInUser) {

        java.util.Set<Long> visibleProjectIds = projectService.getVisibleProjects(loggedInUser.getId())
                .stream()
                .map(com.nexusflow.entity.Project::getId)
                .collect(java.util.stream.Collectors.toSet());

        java.util.Map<Long, java.util.Map<String, Integer>> stats = new java.util.LinkedHashMap<>();

        for (Long projectId : visibleProjectIds) {
            List<TaskAssignment> tasks = taskAssignmentRepository.findByProjectId(projectId);

            java.util.Map<String, Integer> projectStats = new java.util.LinkedHashMap<>();
            projectStats.put("total", 0);
            projectStats.put("completed", 0);
            projectStats.put("underReview", 0);
            projectStats.put("pending", 0);

            for (TaskAssignment task : tasks) {
                projectStats.merge("total", 1, Integer::sum);
                switch (task.getStatus()) {
                    case "COMPLETED" -> projectStats.merge("completed", 1, Integer::sum);
                    case "PHASE1_REVIEW",
                         "PHASE2_REVIEW",
                         "PHASE3_REVIEW" -> projectStats.merge("underReview", 1, Integer::sum);
                    default -> projectStats.merge("pending", 1, Integer::sum);
                }
            }

            stats.put(projectId, projectStats);
        }

        return ResponseEntity.ok(ApiResponse.success(stats, "Project task stats retrieved"));
    }

    /**
     * PUT /api/employee/project/{id}
     * Updates an owned project. Only DRAFT/REJECTED projects are editable.
     */
    @PutMapping("/project/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User loggedInUser) {

        ProjectResponse response = projectService.updateProject(id, request, loggedInUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Project updated successfully"));
    }

    /**
     * GET /api/employee/project/{id}
     * Returns a single project if owned by the logged-in employee.
     */
    @GetMapping("/project/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @PathVariable Long id,
            @AuthenticationPrincipal User loggedInUser) {

        ProjectResponse response = projectService.getProjectById(id, loggedInUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Project retrieved successfully"));
    }

    /**
     * POST /api/employee/project/{id}/submit
     * Submits a DRAFT or REJECTED project for manager approval.
     */
    @PostMapping("/project/{id}/submit")
    public ResponseEntity<ApiResponse<ProjectResponse>> submitProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User loggedInUser) {

        ProjectResponse response = projectService.submitProject(id, loggedInUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Project submitted for approval"));
    }

    // ── Task Assignment Endpoints ────────────────────────────────────────────

    /**
     * GET /api/employee/my-tasks
     * Returns all tasks assigned to the logged-in employee.
     */
    @GetMapping("/my-tasks")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TaskAssignmentResponse>>> getMyTasks(
            @AuthenticationPrincipal User loggedInUser) {
        List<TaskAssignmentResponse> tasks = taskAssignmentRepository
                .findByAssignedToId(loggedInUser.getId())
                .stream()
                .map(TaskAssignmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tasks, "Tasks retrieved successfully"));
    }

    /**
     * POST /api/employee/task/{taskId}/submit-phase
     * Employee submits the CURRENT phase of their task.
     * Body: { "note": "...", "repositoryLink": "..." }
     *
     * Flow:
     *  - Validates that the current phase is PENDING or REJECTED (i.e. awaiting submission)
     *  - Sets phaseX_status = "SUBMITTED"
     *  - Sets overall status = PHASE{X}_REVIEW
     *  - Records submittedAt timestamp
     */
    @PostMapping("/task/{taskId}/submit-phase")
    @Transactional
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> submitPhase(
            @PathVariable Long taskId,
            @AuthenticationPrincipal User loggedInUser,
            @RequestBody(required = false) Map<String, String> body) {

        TaskAssignment task = taskAssignmentRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if (!task.getAssignedTo().getId().equals(loggedInUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not authorized to submit this task"));
        }

        int phase = task.getCurrentPhase();
        if (phase < 1 || phase > 3) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid phase: " + phase));
        }

        // Validate current phase status allows submission
        String currentPhaseStatus = getPhaseStatus(task, phase);
        if (!"PENDING".equals(currentPhaseStatus) && !"REJECTED".equals(currentPhaseStatus)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Phase " + phase + " cannot be submitted (current status: " + currentPhaseStatus + ")"));
        }

        String note = body != null ? body.get("note") : null;
        String repoLink = body != null ? body.get("repositoryLink") : null;

        // Update phase-specific fields
        setPhaseNote(task, phase, note);
        setPhaseRepoLink(task, phase, repoLink);
        setPhaseStatus(task, phase, "SUBMITTED");
        task.setSubmittedNote(note);
        task.setRepositoryLink(repoLink);

        // Update overall status and submittedAt
        task.setStatus("PHASE" + phase + "_REVIEW");
        task.setSubmittedAt(LocalDateTime.now());

        taskAssignmentRepository.save(task);

        return ResponseEntity.ok(ApiResponse.success(
                TaskAssignmentResponse.from(task), "Phase " + phase + " submitted successfully"));
    }

    /**
     * POST /api/employee/task/{taskId}/submit  (legacy – kept for backward compat)
     * Submits current phase. Delegates to submit-phase logic.
     */
    @PostMapping("/task/{taskId}/submit")
    @Transactional
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> submitTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal User loggedInUser,
            @RequestBody(required = false) Map<String, String> body) {
        return submitPhase(taskId, loggedInUser, body);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String getPhaseStatus(TaskAssignment task, int phase) {
        return switch (phase) {
            case 1 -> task.getPhase1Status();
            case 2 -> task.getPhase2Status();
            case 3 -> task.getPhase3Status();
            default -> "LOCKED";
        };
    }

    private void setPhaseStatus(TaskAssignment task, int phase, String status) {
        switch (phase) {
            case 1 -> task.setPhase1Status(status);
            case 2 -> task.setPhase2Status(status);
            case 3 -> task.setPhase3Status(status);
        }
    }

    private void setPhaseNote(TaskAssignment task, int phase, String note) {
        switch (phase) {
            case 1 -> task.setPhase1Note(note);
            case 2 -> task.setPhase2Note(note);
            case 3 -> task.setPhase3Note(note);
        }
    }

    private void setPhaseRepoLink(TaskAssignment task, int phase, String link) {
        switch (phase) {
            case 1 -> task.setPhase1RepoLink(link);
            case 2 -> task.setPhase2RepoLink(link);
            case 3 -> task.setPhase3RepoLink(link);
        }
    }
}
