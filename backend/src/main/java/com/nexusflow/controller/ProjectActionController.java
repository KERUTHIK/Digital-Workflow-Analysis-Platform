package com.nexusflow.controller;

import com.nexusflow.dto.AttachmentDTO;
import com.nexusflow.dto.TimelineEventDTO;
import com.nexusflow.entity.Approval;
import com.nexusflow.entity.AuditLog;
import com.nexusflow.entity.TaskAssignment;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.repository.ApprovalRepo;
import com.nexusflow.repository.AuditLogRepository;
import com.nexusflow.repository.TaskAssignmentRepository;
import com.nexusflow.service.AttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}")
public class ProjectActionController {

    private final AttachmentService attachmentService;
    private final ApprovalRepo approvalRepo;
    private final AuditLogRepository auditLogRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;

    public ProjectActionController(AttachmentService attachmentService,
                                   ApprovalRepo approvalRepo,
                                   AuditLogRepository auditLogRepository,
                                   TaskAssignmentRepository taskAssignmentRepository) {
        this.attachmentService = attachmentService;
        this.approvalRepo = approvalRepo;
        this.auditLogRepository = auditLogRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
    }

    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<List<TimelineEventDTO>>> getTimeline(@PathVariable Long projectId) {
        List<TimelineEventDTO> timeline = new ArrayList<>();

        // 1. Get approvals
        List<Approval> approvals = approvalRepo.findByProjectId(projectId);
        for (Approval a : approvals) {
            String status = a.getStatus().name().toLowerCase();
            String action = a.getStatus().name().equals("PENDING") ? "Project Submitted" : "Project " + a.getStatus().name().substring(0, 1) + a.getStatus().name().substring(1).toLowerCase();
            timeline.add(new TimelineEventDTO(
                "app-" + a.getId(),
                action,
                a.getReviewer() != null ? a.getReviewer().getName() : "System",
                a.getActionTime() != null ? a.getActionTime().toString() : a.getProject().getCreatedAt().toString(),
                status,
                a.getComment()
            ));
        }

        // 2. Get Audit Logs (for creation etc)
        List<AuditLog> logs = auditLogRepository.findByProjectId(projectId);
        for (AuditLog log : logs) {
            if (log.getAction().equals("PROJECT_CREATED")) {
                timeline.add(new TimelineEventDTO(
                    "log-" + log.getId(),
                    "Project Created",
                    log.getUser().getName(),
                    log.getTimestamp().toString(),
                    "info",
                    "Initial project submission"
                ));
            }
        }

        // 3. Get task assignment activities
        List<TaskAssignment> tasks = taskAssignmentRepository.findByProjectId(projectId);
        for (TaskAssignment t : tasks) {
            String employeeName = t.getAssignedTo().getName();

            // Task assigned event
            timeline.add(new TimelineEventDTO(
                "task-assigned-" + t.getId(),
                "Task Assigned",
                employeeName,
                t.getCreatedAt().toString(),
                "info",
                "Task: \"" + t.getTitle() + "\" assigned to " + employeeName
            ));

            // Task submitted event
            if (t.getSubmittedAt() != null) {
                String note = t.getSubmittedNote() != null && !t.getSubmittedNote().isBlank()
                    ? "\"" + t.getTitle() + "\" — " + t.getSubmittedNote()
                    : "\"" + t.getTitle() + "\" submitted for review";
                timeline.add(new TimelineEventDTO(
                    "task-submitted-" + t.getId(),
                    "Task Submitted",
                    employeeName,
                    t.getSubmittedAt().toString(),
                    "submission",
                    note
                ));
            }

            // Task reviewed event
            if (t.getReviewedAt() != null) {
                boolean approved = "COMPLETED".equals(t.getStatus());
                timeline.add(new TimelineEventDTO(
                    "task-reviewed-" + t.getId(),
                    approved ? "Task Approved" : "Task Rejected",
                    "Manager",
                    t.getReviewedAt().toString(),
                    approved ? "approved" : "rejected",
                    "Review of \"" + t.getTitle() + "\" by " + employeeName
                ));
            }
        }

        // Sort by date desc
        timeline.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        return ResponseEntity.ok(ApiResponse.success(timeline, "Timeline retrieved successfully"));
    }

    @GetMapping("/submissions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSubmissions(@PathVariable Long projectId) {
        List<TaskAssignment> tasks = taskAssignmentRepository.findByProjectId(projectId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (TaskAssignment t : tasks) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("taskId", t.getId());
            entry.put("taskTitle", t.getTitle());
            entry.put("taskDescription", t.getDescription());
            entry.put("status", t.getStatus());
            entry.put("employeeName", t.getAssignedTo().getName());
            entry.put("employeeEmail", t.getAssignedTo().getEmail());
            entry.put("submittedNote",
                    t.getSubmittedNote() != null ? t.getSubmittedNote()
                            : t.getPhase3Note() != null ? t.getPhase3Note()
                            : t.getPhase2Note() != null ? t.getPhase2Note()
                            : t.getPhase1Note());
            entry.put("repositoryLink",
                    t.getRepositoryLink() != null ? t.getRepositoryLink()
                            : t.getPhase3RepoLink() != null ? t.getPhase3RepoLink()
                            : t.getPhase2RepoLink() != null ? t.getPhase2RepoLink()
                            : t.getPhase1RepoLink());
            entry.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            entry.put("submittedAt", t.getSubmittedAt() != null ? t.getSubmittedAt().toString() : null);
            entry.put("reviewedAt", t.getReviewedAt() != null ? t.getReviewedAt().toString() : null);
            entry.put("managerFeedback", t.getManagerFeedback());
            entry.put("dueDate", t.getDueDate());
            entry.put("currentPhase", t.getCurrentPhase());
            entry.put("phase1Status", t.getPhase1Status());
            entry.put("phase2Status", t.getPhase2Status());
            entry.put("phase3Status", t.getPhase3Status());
            entry.put("phase1Note", t.getPhase1Note());
            entry.put("phase2Note", t.getPhase2Note());
            entry.put("phase3Note", t.getPhase3Note());
            entry.put("phase1RepoLink", t.getPhase1RepoLink());
            entry.put("phase2RepoLink", t.getPhase2RepoLink());
            entry.put("phase3RepoLink", t.getPhase3RepoLink());
            entry.put("phase1Feedback", t.getPhase1Feedback());
            entry.put("phase2Feedback", t.getPhase2Feedback());
            entry.put("phase3Feedback", t.getPhase3Feedback());
            result.add(entry);
        }

        return ResponseEntity.ok(ApiResponse.success(result, "Submissions retrieved successfully"));
    }

    @GetMapping("/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(attachmentService.getAttachmentsByProject(projectId), "Attachments retrieved successfully"));
    }

    @PostMapping("/attachments")
    public ResponseEntity<ApiResponse<AttachmentDTO>> addAttachment(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User loggedInUser,
            @RequestBody AttachmentDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(attachmentService.addAttachment(projectId, loggedInUser.getId(), dto), "Attachment added successfully"));
    }
}

