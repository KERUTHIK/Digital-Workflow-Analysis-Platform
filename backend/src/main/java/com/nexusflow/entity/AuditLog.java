package com.nexusflow.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Immutable audit trail entry for every project status transition.
 * Uses explicit getters/setters (no Lombok on entity).
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "old_status", length = 20)
    private String oldStatus;

    @Column(name = "new_status", length = 20)
    private String newStatus;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // ── Constructors ─────────────────────────────────────────────────────────

    public AuditLog() {}

    // ── JPA Lifecycle ────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                             { return id; }
    public void setId(Long id)                      { this.id = id; }

    public User getUser()                           { return user; }
    public void setUser(User user)                  { this.user = user; }

    public String getAction()                       { return action; }
    public void setAction(String action)            { this.action = action; }

    public Project getProject()                     { return project; }
    public void setProject(Project project)         { this.project = project; }

    public String getOldStatus()                    { return oldStatus; }
    public void setOldStatus(String oldStatus)      { this.oldStatus = oldStatus; }

    public String getNewStatus()                    { return newStatus; }
    public void setNewStatus(String newStatus)      { this.newStatus = newStatus; }

    public LocalDateTime getTimestamp()             { return timestamp; }
    public void setTimestamp(LocalDateTime t)       { this.timestamp = t; }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private String action;
        private Project project;
        private String oldStatus;
        private String newStatus;

        public Builder user(User user)              { this.user = user; return this; }
        public Builder action(String action)        { this.action = action; return this; }
        public Builder project(Project project)     { this.project = project; return this; }
        public Builder oldStatus(String s)          { this.oldStatus = s; return this; }
        public Builder newStatus(String s)          { this.newStatus = s; return this; }

        public AuditLog build() {
            AuditLog l = new AuditLog();
            l.user      = this.user;
            l.action    = this.action;
            l.project   = this.project;
            l.oldStatus = this.oldStatus;
            l.newStatus = this.newStatus;
            return l;
        }
    }
}
