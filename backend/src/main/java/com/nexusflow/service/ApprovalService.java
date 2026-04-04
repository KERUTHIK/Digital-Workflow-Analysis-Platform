package com.nexusflow.service;

import com.nexusflow.dto.ApprovalResponse;
import com.nexusflow.entity.Approval;
import com.nexusflow.entity.ApprovalStatus;
import com.nexusflow.entity.Project;
import com.nexusflow.entity.Role;
import com.nexusflow.entity.Team;
import com.nexusflow.entity.User;
import com.nexusflow.exception.BusinessException;
import com.nexusflow.exception.ResourceNotFoundException;
import com.nexusflow.repository.ApprovalRepo;
import com.nexusflow.repository.ProjectRepository;
import com.nexusflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Handles project approval/rejection workflows including:
 * - SLA deadline enforcement
 * - Audit logging on every decision
 * - Project status synchronization
 */
@Service
public class ApprovalService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalService.class);

    private final ApprovalRepo approvalRepo;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public ApprovalService(ApprovalRepo approvalRepo,
                           ProjectRepository projectRepository,
                           UserRepository userRepository,
                           AuditLogService auditLogService) {
        this.approvalRepo = approvalRepo;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Returns all PENDING approvals for projects owned by the manager's team.
     */
    @Transactional(readOnly = true)
    public List<ApprovalResponse> getPendingApprovals(Long managerId) {
        return approvalRepo.findPendingApprovalsByManagerId(managerId)
                .stream()
                .map(ApprovalResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Manager approves a project.
     * - Finds (or creates) the PENDING approval record
     * - Updates project status to APPROVED
     * - Records action time and comment
     * - Writes audit log
     */
    @Transactional
    public ApprovalResponse approveProject(Long projectId, Long managerId, String comment) {
        return processDecision(projectId, managerId, comment, ApprovalStatus.APPROVED);
    }

    /**
     * Manager rejects a project.
     * Same flow as approve but sets status to REJECTED.
     */
    @Transactional
    public ApprovalResponse rejectProject(Long projectId, Long managerId, String comment) {
        return processDecision(projectId, managerId, comment, ApprovalStatus.REJECTED);
    }

    // ── Internal decision processor ───────────────────────────────────────────

    private ApprovalResponse processDecision(Long projectId,
                                             Long managerId,
                                             String comment,
                                             ApprovalStatus decision) {
        // 1. Validate project exists and belongs to manager's team
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getAssignedTeam() == null 
                || project.getAssignedTeam().getManager() == null
                || !project.getAssignedTeam().getManager().getId().equals(managerId)) {
            throw new BusinessException("This project does not belong to your team");
        }


        // 2. Validate manager
        User reviewer = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", managerId));

        // 3. Find existing PENDING approval or create a new one
        Approval approval = approvalRepo
                .findByProjectIdAndStatus(projectId, ApprovalStatus.PENDING)
                .orElseGet(() -> {
                    Approval newApproval = Approval.builder()
                            .project(project)
                            .reviewer(reviewer)
                            .status(ApprovalStatus.PENDING)
                            .build();
                    return approvalRepo.save(newApproval);
                });

        // 4. Record the decision
        String oldDecision = approval.getStatus().name();
        approval.setStatus(decision);
        approval.setComment(comment);
        approval.setActionTime(LocalDateTime.now());
        approvalRepo.save(approval);

        // 5. Update project progress if approved
        if (decision == ApprovalStatus.APPROVED) {
            project.setProgress(100);
            projectRepository.save(project);
            log.info("Project {} marked as 100% complete via approval", projectId);
        }


        // 6. Write audit log
        String action = (decision == ApprovalStatus.APPROVED) ? "PROJECT_APPROVED" : "PROJECT_REJECTED";
        auditLogService.log(managerId, action, project, oldDecision, decision.name());

        log.info("Project {} {} by manager {} (id={})",
                projectId, decision, reviewer.getName(), managerId);

        return ApprovalResponse.from(approval);
    }

    /**
     * Creates a new PENDING approval record when a project is submitted.
     * Called after the employee submits the project.
     */
    @Transactional
    public Approval createPendingApproval(Project project, User reviewer) {
        // Check if a PENDING approval already exists for this project
        return approvalRepo.findByProjectIdAndStatus(project.getId(), ApprovalStatus.PENDING)
                .orElseGet(() -> approvalRepo.save(
                        Approval.builder()
                                .project(project)
                                .reviewer(reviewer)
                                .status(ApprovalStatus.PENDING)
                                .build()
                ));
    }
}
