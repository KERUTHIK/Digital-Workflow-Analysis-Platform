package com.nexusflow.controller;

import com.nexusflow.dto.ApprovalActionRequest;
import com.nexusflow.dto.ApprovalResponse;
import com.nexusflow.dto.ManagerAnalyticsDTO;
import com.nexusflow.dto.PagedResponse;
import com.nexusflow.dto.ProjectResponse;
import com.nexusflow.dto.TaskAssignmentRequest;
import com.nexusflow.dto.TaskAssignmentResponse;
import com.nexusflow.dto.UserDTO;
import com.nexusflow.entity.Project;
import com.nexusflow.entity.Role;
import com.nexusflow.entity.TaskAssignment;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.repository.ApprovalRepo;
import com.nexusflow.repository.ProjectRepository;
import com.nexusflow.repository.TaskAssignmentRepository;
import com.nexusflow.repository.UserRepository;
import com.nexusflow.service.ApprovalService;
import com.nexusflow.service.ProjectService;
import com.nexusflow.service.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Manager-only endpoints.
 * Manager sees only their own team's data via manager_id FK.
 */
@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class ManagerController {

    private final UserService userService;
    private final ProjectService projectService;
    private final ApprovalService approvalService;
    private final ApprovalRepo approvalRepo;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ManagerController(UserService userService, ProjectService projectService,
                             ApprovalService approvalService,
                             ApprovalRepo approvalRepo,
                             TaskAssignmentRepository taskAssignmentRepository,
                             ProjectRepository projectRepository,
                             UserRepository userRepository) {
        this.userService = userService;
        this.projectService = projectService;
        this.approvalService = approvalService;
        this.approvalRepo = approvalRepo;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/manager/team
     * Returns all employees where manager_id = logged-in manager's ID.
     */
    @GetMapping("/team")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getTeam(
            @AuthenticationPrincipal User loggedInUser) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getTeam(loggedInUser.getId()), "Team retrieved successfully"));
    }

    /**
     * GET /api/manager/team/stats
     * Returns per-member real stats computed from the projects and approvals tables:
     * activeProjects, completedProjects, totalProjects, approvalRate, performanceScore.
     * Response: Map<userId, { active, completed, total, approvalRate, performanceScore }>
     */
    @GetMapping("/member-stats")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<Long, Map<String, Object>>>> getTeamMemberStats(
            @AuthenticationPrincipal User loggedInUser) {

        // Use the same team scope as the team listing endpoint.
        List<User> teamMembers = userRepository.findByManagerIdOrTeamManagerId(loggedInUser.getId());

        Map<Long, Map<String, Object>> result = new LinkedHashMap<>();

        for (User member : teamMembers) {
            Long memberId = member.getId();

            List<TaskAssignment> memberTasks = taskAssignmentRepository.findByAssignedToId(memberId);
            long completedTaskCount = memberTasks.stream().filter(t ->
                    "COMPLETED".equals(t.getStatus())
            ).count();
            long rejectedTaskCount  = memberTasks.stream().filter(t ->
                    "REJECTED".equals(t.getStatus())
            ).count();
            long activeTaskCount = memberTasks.stream()
                    .map(TaskAssignment::getStatus)
                    .filter(Objects::nonNull)
                    .filter(status -> !"COMPLETED".equals(status) && !"REJECTED".equals(status))
                    .count();
            long total = memberTasks.size();

            // Approval rate: completed / (completed + rejected) * 100
            double totalDecisions = completedTaskCount + rejectedTaskCount;
            double approvalRate = totalDecisions > 0
                    ? Math.round((double) completedTaskCount / totalDecisions * 1000.0) / 10.0
                    : 0.0;
            double rejectionRate = totalDecisions > 0
                    ? Math.round((double) rejectedTaskCount / totalDecisions * 1000.0) / 10.0
                    : 0.0;

            // Simple performance score: balance approval rate, volume, and low rejection
            int volumeBonus = (int) Math.min(10, total / 2);
            int performanceScore = (int) Math.min(100, Math.round(approvalRate * 0.7 + (100 - rejectionRate) * 0.1 + volumeBonus + 10));

            // Calculate avgSubmissionTime (in days) using tasks
            double avgSubmissionTime = memberTasks.stream()
                    .filter(t -> "COMPLETED".equals(t.getStatus()) || "REJECTED".equals(t.getStatus()))
                    .filter(t -> t.getSubmittedAt() != null && t.getCreatedAt() != null)
                    .mapToDouble(t -> java.time.Duration.between(t.getCreatedAt(), t.getSubmittedAt()).toHours() / 24.0)
                    .average()
                    .orElse(0.0);
            avgSubmissionTime = Math.round(avgSubmissionTime * 10.0) / 10.0;

            // Simple streak: approved tasks in last 30 days
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            long streak = memberTasks.stream()
                    .filter(t -> "COMPLETED".equals(t.getStatus()))
                    .filter(t -> t.getReviewedAt() != null && t.getReviewedAt().isAfter(thirtyDaysAgo))
                    .count();

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("active",           activeTaskCount);
            stats.put("completed",        completedTaskCount);
            stats.put("rejected",         rejectedTaskCount);
            stats.put("total",            total);
            stats.put("approvalRate",     approvalRate);
            stats.put("rejectionRate",    rejectionRate);
            stats.put("performanceScore", performanceScore);
            stats.put("slaCompliance",    approvalRate > 0 ? Math.min(100, (int)(approvalRate * 0.9 + 10)) : 80);
            stats.put("avgSubmissionTime", avgSubmissionTime);
            stats.put("streak",           streak);
            stats.put("skills",           member.getSkills());
            stats.put("taskActive",       activeTaskCount);
            stats.put("taskCompleted",    completedTaskCount);
            stats.put("taskRejected",     rejectedTaskCount);

            result.put(memberId, stats);
        }

        return ResponseEntity.ok(ApiResponse.success(result, "Team member stats retrieved"));
    }


    /**
     * GET /api/manager/team-projects?page=0&size=10
     * Returns projects submitted by the manager's team (paginated).
     */
    @GetMapping("/team-projects")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getTeamProjects(
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
                projectService.getTeamProjects(loggedInUser.getId(), pageable),
                "Team projects retrieved successfully"));
    }

    /**
     * GET /api/manager/pending-approvals
     * Returns all PENDING approval records for the manager's team.
     * Includes SLA breach indicator.
     */
    @GetMapping("/pending-approvals")
    public ResponseEntity<ApiResponse<List<ApprovalResponse>>> getPendingApprovals(
            @AuthenticationPrincipal User loggedInUser) {
        return ResponseEntity.ok(ApiResponse.success(
                approvalService.getPendingApprovals(loggedInUser.getId()),
                "Pending approvals retrieved successfully"));
    }

    /**
     * POST /api/manager/approve/{projectId}
     * Approves the specified project.
     * Body: { "comment": "Looks great!" }
     */
    @PostMapping("/approve/{projectId}")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User loggedInUser,
            @RequestBody(required = false) ApprovalActionRequest request) {

        String comment = (request != null) ? request.getComment() : null;
        ApprovalResponse response = approvalService.approveProject(projectId, loggedInUser.getId(), comment);
        return ResponseEntity.ok(ApiResponse.success(response, "Project approved successfully"));
    }

    /**
     * POST /api/manager/reject/{projectId}
     * Rejects the specified project.
     * Body: { "comment": "Needs revision" }
     */
    @PostMapping("/reject/{projectId}")
    public ResponseEntity<ApiResponse<ApprovalResponse>> rejectProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User loggedInUser,
            @RequestBody(required = false) ApprovalActionRequest request) {

        String comment = (request != null) ? request.getComment() : null;
        ApprovalResponse response = approvalService.rejectProject(projectId, loggedInUser.getId(), comment);
        return ResponseEntity.ok(ApiResponse.success(response, "Project rejected successfully"));
    }

    // ── Analytics Endpoint ────────────────────────────────────────────────────

    /**
     * GET /api/manager/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * Returns date-filtered analytics for the logged-in manager's team.
     * Both params are optional; they default to the last 30 days.
     */
    @GetMapping("/analytics")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<ManagerAnalyticsDTO>> getAnalytics(
            @AuthenticationPrincipal User loggedInUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        // Default to last 30 days when no params supplied
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end   = (endDate   != null) ? endDate.atTime(23, 59, 59)   : now;
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay()     : now.minusDays(30);

        Long managerId = loggedInUser.getId();

        // ── Monthly trend ──────────────────────────────────────────────────────
        List<Object[]> projCounts = projectRepository
                .getMonthlyProjectCountsByManagerAndRange(managerId, start, end);
        List<Object[]> apprCounts = projectRepository
                .getMonthlyApprovalCountsByManagerAndRange(managerId, start, end);

        Map<Integer, Long> pMap = new LinkedHashMap<>();
        for (Object[] r : projCounts) pMap.put(((Number) r[0]).intValue(), ((Number) r[1]).longValue());

        Map<Integer, Long> aMap = new LinkedHashMap<>();
        for (Object[] r : apprCounts) aMap.put(((Number) r[0]).intValue(), ((Number) r[1]).longValue());

        // Build trend list covering every month that had any activity
        Set<Integer> months = new TreeSet<>();
        months.addAll(pMap.keySet());
        months.addAll(aMap.keySet());

        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int m : months) {
            String monthName = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", monthName);
            row.put("submissions", pMap.getOrDefault(m, 0L));
            row.put("approved",    aMap.getOrDefault(m, 0L));
            monthlyTrend.add(row);
        }

        // ── Aggregates ─────────────────────────────────────────────────────────
        long totalSubmissions = projectRepository.countByManagerAndRange(managerId, start, end);
        long totalApproved    = approvalRepo.countApprovedByManagerAndRange(managerId, start, end);
        long totalRejected    = approvalRepo.countRejectedByManagerAndRange(managerId, start, end);

        double approvalRate   = totalSubmissions > 0 ? (double) totalApproved  / totalSubmissions * 100 : 0;
        double rejectionRate  = totalSubmissions > 0 ? (double) totalRejected  / totalSubmissions * 100 : 0;

        Double avgHoursRaw = approvalRepo.getAvgApprovalHoursByManagerAndRange(managerId, start, end);
        double avgApprovalHours = avgHoursRaw != null ? Math.round(avgHoursRaw * 10.0) / 10.0 : 0;

        // ── SLA breach rate ────────────────────────────────────────────────────
        List<Object[]> slaRows = approvalRepo
                .getSlaBreachTrendByManagerAndRange(managerId, start, end, now);
        long totalBreached = slaRows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        // Use pending approvals in range as denominator approximation
        long pendingInRange = approvalRepo
                .findByReviewerIdAndStatus(managerId, com.nexusflow.entity.ApprovalStatus.PENDING)
                .size();
        double slaBreachRate = (pendingInRange + totalBreached) > 0
                ? (double) totalBreached / (pendingInRange + totalBreached) * 100 : 0;

        // ── Computed scores ────────────────────────────────────────────────────
        // Efficiency: rewards fast approvals, penalises breaches and rejections
        int speedScore     = avgApprovalHours > 0 ? (int) Math.max(0, 100 - avgApprovalHours * 1.5) : 80;
        int efficiencyScore = (int) Math.round((speedScore * 0.4) + (approvalRate * 0.4) + ((100 - slaBreachRate) * 0.2));
        efficiencyScore = Math.min(100, Math.max(0, efficiencyScore));

        int teamPerformanceIndex = (int) Math.round((approvalRate * 0.5) + ((100 - rejectionRate) * 0.3) +
                                                     (Math.min(100, totalSubmissions * 5L) * 0.2));
        teamPerformanceIndex = Math.min(100, Math.max(0, teamPerformanceIndex));

        // ── Build response ─────────────────────────────────────────────────────
        ManagerAnalyticsDTO dto = new ManagerAnalyticsDTO();
        dto.setMonthlyTrend(monthlyTrend);
        dto.setAvgApprovalHours(avgApprovalHours);
        dto.setApprovalRate(Math.round(approvalRate * 10.0) / 10.0);
        dto.setSlaBreachRate(Math.round(slaBreachRate * 10.0) / 10.0);
        dto.setRejectionRate(Math.round(rejectionRate * 10.0) / 10.0);
        dto.setEfficiencyScore(efficiencyScore);
        dto.setTeamPerformanceIndex(teamPerformanceIndex);
        dto.setTotalSubmissions(totalSubmissions);
        dto.setTotalApproved(totalApproved);

        return ResponseEntity.ok(ApiResponse.success(dto, "Analytics retrieved successfully"));
    }

    // ── Team Member Trend Endpoint ────────────────────────────────────────────

    /**
     * GET /api/manager/team/trends
     * Returns monthly submitted/approved task counts per employee for the manager's team.
     * Response: Map<userId, List<{month, submitted, approved}>>
     */
    @GetMapping("/team/trends")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.Map<Long, java.util.List<java.util.Map<String, Object>>>>> getTeamTrends(
            @AuthenticationPrincipal User loggedInUser) {

        List<User> teamMembers = userRepository.findByManagerIdOrTeamManagerId(loggedInUser.getId());

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime since = now.minusMonths(6).withDayOfMonth(1).toLocalDate().atStartOfDay();

        java.util.Map<Long, java.util.Map<Integer, Long>> submittedByEmployee = new java.util.LinkedHashMap<>();
        java.util.Map<Long, java.util.Map<Integer, Long>> approvedByEmployee = new java.util.LinkedHashMap<>();

        for (User member : teamMembers) {
            Long memberId = member.getId();
            java.util.Map<Integer, Long> submitted = new java.util.LinkedHashMap<>();
            for (Object[] row : projectRepository.getMonthlyProjectCountsByCreatedByIdAndRange(memberId, since, now)) {
                submitted.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }

            java.util.Map<Integer, Long> approved = new java.util.LinkedHashMap<>();
            for (Object[] row : approvalRepo.getMonthlyApprovedProjectCountsByCreatorAndRange(memberId, since, now)) {
                approved.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }

            submittedByEmployee.put(memberId, submitted);
            approvedByEmployee.put(memberId, approved);
        }

        // Convert to frontend-friendly format
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MMM", java.util.Locale.ENGLISH);
        java.util.Map<Long, java.util.List<java.util.Map<String, Object>>> result = new java.util.LinkedHashMap<>();

        for (User member : teamMembers) {
            Long memberId = member.getId();
            java.util.List<java.util.Map<String, Object>> trend = new java.util.ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                java.time.YearMonth ym = java.time.YearMonth.from(now.minusMonths(i));
                int monthNumber = ym.getMonthValue();
                java.util.Map<String, Object> point = new java.util.LinkedHashMap<>();
                point.put("month", ym.atDay(1).format(fmt));
                point.put("submitted", submittedByEmployee.getOrDefault(memberId, java.util.Collections.emptyMap()).getOrDefault(monthNumber, 0L));
                point.put("approved", approvedByEmployee.getOrDefault(memberId, java.util.Collections.emptyMap()).getOrDefault(monthNumber, 0L));
                trend.add(point);
            }

            result.put(memberId, trend);
        }

        return ResponseEntity.ok(ApiResponse.success(result, "Team trends retrieved"));
    }

    // ── Task Assignment Endpoints ─────────────────────────────────────────────

    /**
     * GET /api/manager/projects/task-stats
     * Returns task completion counts per project:
     *   { projectId: { total, completed, underReview, pending } }
     * Used by the frontend to compute project status and progress %.
     */
    @GetMapping("/projects/task-stats")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<java.util.Map<Long, java.util.Map<String, Integer>>>> getProjectTaskStats(
            @AuthenticationPrincipal User loggedInUser) {

        List<TaskAssignment> allTasks;
        if (loggedInUser.getRole() == Role.ADMIN) {
            allTasks = taskAssignmentRepository.findAll();
        } else {
            allTasks = taskAssignmentRepository.findAllByAssignedByManagerId(loggedInUser.getId());
        }

        // Group tasks by projectId and count by status
        java.util.Map<Long, java.util.Map<String, Integer>> stats = new java.util.LinkedHashMap<>();

        for (TaskAssignment t : allTasks) {
            // Ignore tasks assigned to the manager themselves (ghost tasks from previous bugs)
            if (t.getAssignedTo().getId().equals(loggedInUser.getId())) {
                continue;
            }

            Long pid = t.getProject().getId();
            java.util.Map<String, Integer> s = stats.computeIfAbsent(pid, k -> {
                java.util.Map<String, Integer> m = new java.util.LinkedHashMap<>();
                m.put("total", 0);
                m.put("completed", 0);
                m.put("underReview", 0);
                m.put("pending", 0);
                return m;
            });
            s.merge("total", 1, Integer::sum);
            switch (t.getStatus()) {
                case "COMPLETED"     -> s.merge("completed", 1, Integer::sum);
                case "PHASE1_REVIEW",
                     "PHASE2_REVIEW",
                     "PHASE3_REVIEW" -> s.merge("underReview", 1, Integer::sum);
                default              -> s.merge("pending", 1, Integer::sum);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(stats, "Project task stats retrieved"));
    }

    /**
     * GET /api/manager/project/{projectId}/tasks
     * Returns all tasks assigned for this project.
     */
    @GetMapping("/project/{projectId}/tasks")
    public ResponseEntity<ApiResponse<List<TaskAssignmentResponse>>> getProjectTasks(
            @PathVariable Long projectId) {
        List<TaskAssignmentResponse> tasks = taskAssignmentRepository
                .findByProjectId(projectId)
                .stream()
                .map(TaskAssignmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tasks, "Tasks retrieved successfully"));
    }

    /**
     * POST /api/manager/project/{projectId}/tasks
     * Replaces all task assignments for this project.
     * Body: List<TaskAssignmentRequest>
     */
    @PostMapping("/project/{projectId}/tasks")
    @Transactional
    public ResponseEntity<ApiResponse<List<TaskAssignmentResponse>>> assignTasks(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User loggedInManager,
            @RequestBody List<TaskAssignmentRequest> requests) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        // Only remove tasks that are NOT completed — preserve approved work
        taskAssignmentRepository.deleteNonCompletedByProjectId(projectId);
        taskAssignmentRepository.flush();

        // Get IDs of employees who already have a COMPLETED task for this project
        List<TaskAssignment> completedTasks = taskAssignmentRepository.findByProjectId(projectId)
                .stream()
                .filter(t -> "COMPLETED".equals(t.getStatus()))
                .collect(Collectors.toList());
        java.util.Set<Long> completedEmployeeIds = completedTasks.stream()
                .map(t -> t.getAssignedTo().getId())
                .collect(java.util.stream.Collectors.toSet());

        List<TaskAssignment> saved = requests.stream()
                .filter(r -> r.getTitle() != null && !r.getTitle().isBlank())
                .filter(r -> !completedEmployeeIds.contains(r.getAssignedToId())) // skip completed
                .map(r -> {
                    User employee = userRepository.findById(r.getAssignedToId())
                            .orElseThrow(() -> new RuntimeException("User not found: " + r.getAssignedToId()));
                    TaskAssignment ta = new TaskAssignment();
                    ta.setProject(project);
                    ta.setAssignedTo(employee);
                    ta.setTitle(r.getTitle());
                    ta.setDescription(r.getDescription());
                    ta.setDueDate(r.getDueDate());
                    ta.setAssignedByManagerId(loggedInManager.getId());
                    // Phase descriptions
                    ta.setPhase1Description(r.getPhase1Description());
                    ta.setPhase2Description(r.getPhase2Description());
                    ta.setPhase3Description(r.getPhase3Description());
                    return taskAssignmentRepository.save(ta);
                })
                .collect(Collectors.toList());

        // Include completed tasks in response too
        List<TaskAssignmentResponse> completedResponses = completedTasks.stream()
                .map(TaskAssignmentResponse::from)
                .collect(Collectors.toList());
        List<TaskAssignmentResponse> result = new java.util.ArrayList<>(completedResponses);
        result.addAll(saved.stream().map(TaskAssignmentResponse::from).collect(Collectors.toList()));

        return ResponseEntity.ok(ApiResponse.success(result, "Tasks assigned successfully"));
    }

    // ── Task Review Endpoints ─────────────────────────────────────────────────

    /**
     * GET /api/manager/task-reviews
     * Returns all tasks in any PHASE review status (PHASE1_REVIEW, PHASE2_REVIEW, PHASE3_REVIEW)
     * submitted to THIS manager's projects.
     */
    @GetMapping("/task-reviews")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TaskAssignmentResponse>>> getTaskReviews(
            @AuthenticationPrincipal User loggedInUser) {
        List<TaskAssignmentResponse> tasks = taskAssignmentRepository
                .findPhaseReviewsByManagerId(loggedInUser.getId())
                .stream()
                .map(TaskAssignmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tasks, "Phase reviews retrieved"));
    }

    /**
     * POST /api/manager/task/{taskId}/approve
     * Phase-aware approval:
     *   - Phase 1 or 2 approved → advance to next phase (PENDING)
     *   - Phase 3 approved → overall COMPLETED
     */
    @PostMapping("/task/{taskId}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> approveTask(
            @PathVariable Long taskId) {
        TaskAssignment task = taskAssignmentRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        int phase = task.getCurrentPhase();
        setPhaseStatus(task, phase, "APPROVED");
        task.setReviewedAt(java.time.LocalDateTime.now());

        if (phase < 3) {
            // Advance to next phase
            task.setCurrentPhase(phase + 1);
            setPhaseStatus(task, phase + 1, "PENDING");
            task.setStatus("PENDING"); // waiting for next phase submission
        } else {
            // All 3 phases done
            task.setStatus("COMPLETED");
        }

        taskAssignmentRepository.save(task);
        return ResponseEntity.ok(ApiResponse.success(
                TaskAssignmentResponse.from(task),
                phase < 3 ? "Phase " + phase + " approved — Phase " + (phase + 1) + " unlocked" : "Task completed"));
    }

    /**
     * POST /api/manager/task/{taskId}/reject
     * Rejects the current phase — employee must resubmit same phase.
     * Body: { "feedback": "..." }
     */
    @PostMapping("/task/{taskId}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> rejectTask(
            @PathVariable Long taskId,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        TaskAssignment task = taskAssignmentRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        int phase = task.getCurrentPhase();
        String feedback = body != null ? body.get("feedback") : null;

        setPhaseStatus(task, phase, "REJECTED");
        setPhaseFeedback(task, phase, feedback);
        task.setManagerFeedback(feedback); // legacy field
        task.setStatus("REJECTED"); // bounced back to employee
        task.setReviewedAt(java.time.LocalDateTime.now());

        taskAssignmentRepository.save(task);
        return ResponseEntity.ok(ApiResponse.success(
                TaskAssignmentResponse.from(task), "Phase " + phase + " rejected — employee must resubmit"));
    }

    // ── Phase helper methods ──────────────────────────────────────────────────

    private void setPhaseStatus(TaskAssignment task, int phase, String status) {
        switch (phase) {
            case 1 -> task.setPhase1Status(status);
            case 2 -> task.setPhase2Status(status);
            case 3 -> task.setPhase3Status(status);
        }
    }

    private void setPhaseFeedback(TaskAssignment task, int phase, String feedback) {
        switch (phase) {
            case 1 -> task.setPhase1Feedback(feedback);
            case 2 -> task.setPhase2Feedback(feedback);
            case 3 -> task.setPhase3Feedback(feedback);
        }
    }
}
