package com.nexusflow.dto;

import com.nexusflow.entity.Approval;
import com.nexusflow.entity.ApprovalStatus;

import java.time.LocalDateTime;

public class ApprovalResponse {

    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long reviewerId;
    private String reviewerName;
    private ApprovalStatus status;
    private String comment;
    private LocalDateTime actionTime;
    private LocalDateTime slaDeadline;
    private LocalDateTime createdAt;
    private boolean slaBreached;

    public ApprovalResponse() {}

    public ApprovalResponse(Long id, Long projectId, String projectTitle, Long reviewerId, String reviewerName,
                            ApprovalStatus status, String comment, LocalDateTime actionTime,
                            LocalDateTime slaDeadline, LocalDateTime createdAt, boolean slaBreached) {
        this.id = id;
        this.projectId = projectId;
        this.projectTitle = projectTitle;
        this.reviewerId = reviewerId;
        this.reviewerName = reviewerName;
        this.status = status;
        this.comment = comment;
        this.actionTime = actionTime;
        this.slaDeadline = slaDeadline;
        this.createdAt = createdAt;
        this.slaBreached = slaBreached;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }

    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public ApprovalStatus getStatus() { return status; }
    public void setStatus(ApprovalStatus status) { this.status = status; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getActionTime() { return actionTime; }
    public void setActionTime(LocalDateTime actionTime) { this.actionTime = actionTime; }

    public LocalDateTime getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(LocalDateTime slaDeadline) { this.slaDeadline = slaDeadline; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isSlaBreached() { return slaBreached; }
    public void setSlaBreached(boolean slaBreached) { this.slaBreached = slaBreached; }

    // ── Static Factory ───────────────────────────────────────────────────────

    public static ApprovalResponse from(Approval approval) {
        boolean breached = approval.getSlaDeadline() != null
                && LocalDateTime.now().isAfter(approval.getSlaDeadline())
                && approval.getStatus() == ApprovalStatus.PENDING;

        return ApprovalResponse.builder()
                .id(approval.getId())
                .projectId(approval.getProject().getId())
                .projectTitle(approval.getProject().getTitle())
                .reviewerId(approval.getReviewer().getId())
                .reviewerName(approval.getReviewer().getName())
                .status(approval.getStatus())
                .comment(approval.getComment())
                .actionTime(approval.getActionTime())
                .slaDeadline(approval.getSlaDeadline())
                .createdAt(approval.getCreatedAt())
                .slaBreached(breached)
                .build();
    }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private Long reviewerId;
        private String reviewerName;
        private ApprovalStatus status;
        private String comment;
        private LocalDateTime actionTime;
        private LocalDateTime slaDeadline;
        private LocalDateTime createdAt;
        private boolean slaBreached;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder projectId(Long id) { this.projectId = id; return this; }
        public Builder projectTitle(String title) { this.projectTitle = title; return this; }
        public Builder reviewerId(Long id) { this.reviewerId = id; return this; }
        public Builder reviewerName(String name) { this.reviewerName = name; return this; }
        public Builder status(ApprovalStatus status) { this.status = status; return this; }
        public Builder comment(String comment) { this.comment = comment; return this; }
        public Builder actionTime(LocalDateTime t) { this.actionTime = t; return this; }
        public Builder slaDeadline(LocalDateTime t) { this.slaDeadline = t; return this; }
        public Builder createdAt(LocalDateTime t) { this.createdAt = t; return this; }
        public Builder slaBreached(boolean b) { this.slaBreached = b; return this; }

        public ApprovalResponse build() {
            return new ApprovalResponse(id, projectId, projectTitle, reviewerId, reviewerName, status, comment, actionTime, slaDeadline, createdAt, slaBreached);
        }
    }
}
