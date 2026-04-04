package com.nexusflow.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a project submitted by an Employee for approval.
 * Uses explicit getters/setters (no Lombok on entity).
 */
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(precision = 15, scale = 2)
    private BigDecimal budget;

    @Column(nullable = false)
    private Integer progress = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team assignedTeam;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(length = 20)
    private String priority = "Medium";

    // ── Constructors ─────────────────────────────────────────────────────────

    public Project() {}

    // ── JPA Lifecycle ────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.progress == null) this.progress = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                             { return id; }
    public void setId(Long id)                      { this.id = id; }

    public String getTitle()                        { return title; }
    public void setTitle(String title)              { this.title = title; }

    public String getDescription()                  { return description; }
    public void setDescription(String description)  { this.description = description; }

    public String getClientName()                   { return clientName; }
    public void setClientName(String clientName)    { this.clientName = clientName; }

    public BigDecimal getBudget()                   { return budget; }
    public void setBudget(BigDecimal budget)        { this.budget = budget; }

    public Integer getProgress()                    { return progress; }
    public void setProgress(Integer progress)       { this.progress = progress; }

    public User getCreatedBy()                      { return createdBy; }
    public void setCreatedBy(User createdBy)        { this.createdBy = createdBy; }

    public Team getAssignedTeam()                   { return assignedTeam; }
    public void setAssignedTeam(Team team)          { this.assignedTeam = team; }

    public LocalDateTime getCreatedAt()             { return createdAt; }
    public void setCreatedAt(LocalDateTime t)       { this.createdAt = t; }

    public LocalDateTime getUpdatedAt()             { return updatedAt; }
    public void setUpdatedAt(LocalDateTime t)       { this.updatedAt = t; }

    public String getPriority()                     { return priority; }
    public void setPriority(String priority)        { this.priority = priority; }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String title;
        private String description;
        private String clientName;
        private BigDecimal budget;
        private Integer progress = 0;
        private User createdBy;
        private Team assignedTeam;
        private String priority;

        public Builder id(Long id)                      { this.id = id; return this; }
        public Builder title(String title)              { this.title = title; return this; }
        public Builder description(String d)            { this.description = d; return this; }
        public Builder clientName(String cn)            { this.clientName = cn; return this; }
        public Builder budget(BigDecimal budget)        { this.budget = budget; return this; }
        public Builder progress(Integer progress)       { this.progress = progress; return this; }
        public Builder createdBy(User createdBy)        { this.createdBy = createdBy; return this; }
        public Builder assignedTeam(Team team)          { this.assignedTeam = team; return this; }
        public Builder priority(String priority)        { this.priority = priority; return this; }

        public Project build() {
            Project p = new Project();
            p.id          = this.id;
            p.title       = this.title;
            p.description = this.description;
            p.clientName  = this.clientName;
            p.budget      = this.budget;
            p.progress    = this.progress;
            p.createdBy   = this.createdBy;
            p.assignedTeam = this.assignedTeam;
            p.priority    = this.priority != null ? this.priority : "Medium";
            return p;
        }
    }
}
