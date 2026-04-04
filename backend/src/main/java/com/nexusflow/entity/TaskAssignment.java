package com.nexusflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_assignments")
public class TaskAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", nullable = false)
    private User assignedTo;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date", length = 50)
    private String dueDate;

    /**
     * Overall task status:
     * PENDING | PHASE1_REVIEW | PHASE2_REVIEW | PHASE3_REVIEW | COMPLETED | REJECTED
     */
    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    /** Which phase is currently active (1, 2, or 3) */
    @Column(name = "current_phase", nullable = false)
    private int currentPhase = 1;

    // ── Phase descriptions (set by manager at assignment time) ────────────────

    @Column(name = "phase1_description", columnDefinition = "TEXT")
    private String phase1Description;

    @Column(name = "phase2_description", columnDefinition = "TEXT")
    private String phase2Description;

    @Column(name = "phase3_description", columnDefinition = "TEXT")
    private String phase3Description;

    // ── Phase statuses ────────────────────────────────────────────────────────
    // PENDING | SUBMITTED | APPROVED | REJECTED

    @Column(name = "phase1_status", length = 20)
    private String phase1Status = "PENDING";

    @Column(name = "phase2_status", length = 20)
    private String phase2Status = "LOCKED";

    @Column(name = "phase3_status", length = 20)
    private String phase3Status = "LOCKED";

    // ── Phase submission notes (from employee) ────────────────────────────────

    @Column(name = "phase1_note", columnDefinition = "TEXT")
    private String phase1Note;

    @Column(name = "phase2_note", columnDefinition = "TEXT")
    private String phase2Note;

    @Column(name = "phase3_note", columnDefinition = "TEXT")
    private String phase3Note;

    // ── Phase manager feedback ────────────────────────────────────────────────

    @Column(name = "phase1_feedback", columnDefinition = "TEXT")
    private String phase1Feedback;

    @Column(name = "phase2_feedback", columnDefinition = "TEXT")
    private String phase2Feedback;

    @Column(name = "phase3_feedback", columnDefinition = "TEXT")
    private String phase3Feedback;

    // ── Phase repository links ────────────────────────────────────────────────

    @Column(name = "phase1_repo_link", length = 500)
    private String phase1RepoLink;

    @Column(name = "phase2_repo_link", length = 500)
    private String phase2RepoLink;

    @Column(name = "phase3_repo_link", length = 500)
    private String phase3RepoLink;

    // ── Legacy / global fields (kept for backward compat) ────────────────────

    @Column(name = "assigned_by_manager_id")
    private Long assignedByManagerId;

    @Column(name = "submitted_note", columnDefinition = "TEXT")
    private String submittedNote;

    @Column(name = "manager_feedback", columnDefinition = "TEXT")
    private String managerFeedback;

    @Column(name = "repository_link", length = 500)
    private String repositoryLink;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
        if (this.phase1Status == null) this.phase1Status = "PENDING";
        if (this.phase2Status == null) this.phase2Status = "LOCKED";
        if (this.phase3Status == null) this.phase3Status = "LOCKED";
        if (this.currentPhase == 0) this.currentPhase = 1;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId()                              { return id; }
    public void setId(Long id)                       { this.id = id; }

    public Project getProject()                      { return project; }
    public void setProject(Project project)          { this.project = project; }

    public User getAssignedTo()                      { return assignedTo; }
    public void setAssignedTo(User user)             { this.assignedTo = user; }

    public String getTitle()                         { return title; }
    public void setTitle(String title)               { this.title = title; }

    public String getDescription()                   { return description; }
    public void setDescription(String description)   { this.description = description; }

    public String getDueDate()                       { return dueDate; }
    public void setDueDate(String dueDate)           { this.dueDate = dueDate; }

    public String getStatus()                        { return status; }
    public void setStatus(String status)             { this.status = status; }

    public int getCurrentPhase()                     { return currentPhase; }
    public void setCurrentPhase(int p)               { this.currentPhase = p; }

    public String getPhase1Description()             { return phase1Description; }
    public void setPhase1Description(String s)       { this.phase1Description = s; }

    public String getPhase2Description()             { return phase2Description; }
    public void setPhase2Description(String s)       { this.phase2Description = s; }

    public String getPhase3Description()             { return phase3Description; }
    public void setPhase3Description(String s)       { this.phase3Description = s; }

    public String getPhase1Status()                  { return phase1Status; }
    public void setPhase1Status(String s)            { this.phase1Status = s; }

    public String getPhase2Status()                  { return phase2Status; }
    public void setPhase2Status(String s)            { this.phase2Status = s; }

    public String getPhase3Status()                  { return phase3Status; }
    public void setPhase3Status(String s)            { this.phase3Status = s; }

    public String getPhase1Note()                    { return phase1Note; }
    public void setPhase1Note(String s)              { this.phase1Note = s; }

    public String getPhase2Note()                    { return phase2Note; }
    public void setPhase2Note(String s)              { this.phase2Note = s; }

    public String getPhase3Note()                    { return phase3Note; }
    public void setPhase3Note(String s)              { this.phase3Note = s; }

    public String getPhase1Feedback()                { return phase1Feedback; }
    public void setPhase1Feedback(String s)          { this.phase1Feedback = s; }

    public String getPhase2Feedback()                { return phase2Feedback; }
    public void setPhase2Feedback(String s)          { this.phase2Feedback = s; }

    public String getPhase3Feedback()                { return phase3Feedback; }
    public void setPhase3Feedback(String s)          { this.phase3Feedback = s; }

    public String getPhase1RepoLink()                { return phase1RepoLink; }
    public void setPhase1RepoLink(String s)          { this.phase1RepoLink = s; }

    public String getPhase2RepoLink()                { return phase2RepoLink; }
    public void setPhase2RepoLink(String s)          { this.phase2RepoLink = s; }

    public String getPhase3RepoLink()                { return phase3RepoLink; }
    public void setPhase3RepoLink(String s)          { this.phase3RepoLink = s; }

    public Long getAssignedByManagerId()             { return assignedByManagerId; }
    public void setAssignedByManagerId(Long id)      { this.assignedByManagerId = id; }

    public String getSubmittedNote()                 { return submittedNote; }
    public void setSubmittedNote(String note)        { this.submittedNote = note; }

    public String getManagerFeedback()               { return managerFeedback; }
    public void setManagerFeedback(String fb)        { this.managerFeedback = fb; }

    public String getRepositoryLink()                { return repositoryLink; }
    public void setRepositoryLink(String link)       { this.repositoryLink = link; }

    public LocalDateTime getCreatedAt()              { return createdAt; }
    public void setCreatedAt(LocalDateTime t)        { this.createdAt = t; }

    public LocalDateTime getSubmittedAt()            { return submittedAt; }
    public void setSubmittedAt(LocalDateTime t)      { this.submittedAt = t; }

    public LocalDateTime getReviewedAt()             { return reviewedAt; }
    public void setReviewedAt(LocalDateTime t)       { this.reviewedAt = t; }
}
