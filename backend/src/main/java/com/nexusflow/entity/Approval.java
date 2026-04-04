package com.nexusflow.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Records a Manager's approval or rejection decision on a Project.
 * Uses explicit getters/setters (no Lombok on entity).
 */
@Entity
@Table(name = "approvals")
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "action_time")
    private LocalDateTime actionTime;

    /** SLA deadline: 48 hours from creation. */
    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Constructors ─────────────────────────────────────────────────────────

    public Approval() {}

    // ── JPA Lifecycle ────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = ApprovalStatus.PENDING;
        if (this.slaDeadline == null) {
            this.slaDeadline = this.createdAt.plusHours(48);
        }
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                                 { return id; }
    public void setId(Long id)                          { this.id = id; }

    public Project getProject()                         { return project; }
    public void setProject(Project project)             { this.project = project; }

    public User getReviewer()                           { return reviewer; }
    public void setReviewer(User reviewer)              { this.reviewer = reviewer; }

    public ApprovalStatus getStatus()                   { return status; }
    public void setStatus(ApprovalStatus status)        { this.status = status; }

    public String getComment()                          { return comment; }
    public void setComment(String comment)              { this.comment = comment; }

    public LocalDateTime getActionTime()                { return actionTime; }
    public void setActionTime(LocalDateTime t)          { this.actionTime = t; }

    public LocalDateTime getSlaDeadline()               { return slaDeadline; }
    public void setSlaDeadline(LocalDateTime t)         { this.slaDeadline = t; }

    public LocalDateTime getCreatedAt()                 { return createdAt; }
    public void setCreatedAt(LocalDateTime t)           { this.createdAt = t; }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Project project;
        private User reviewer;
        private ApprovalStatus status = ApprovalStatus.PENDING;
        private String comment;
        private LocalDateTime slaDeadline;

        public Builder project(Project project)         { this.project = project; return this; }
        public Builder reviewer(User reviewer)          { this.reviewer = reviewer; return this; }
        public Builder status(ApprovalStatus status)    { this.status = status; return this; }
        public Builder comment(String comment)          { this.comment = comment; return this; }
        public Builder slaDeadline(LocalDateTime t)     { this.slaDeadline = t; return this; }

        public Approval build() {
            Approval a = new Approval();
            a.project     = this.project;
            a.reviewer    = this.reviewer;
            a.status      = this.status;
            a.comment     = this.comment;
            a.slaDeadline = this.slaDeadline;
            return a;
        }
    }
}
