package com.nexusflow.dto;

import com.nexusflow.entity.TaskAssignment;

public class TaskAssignmentResponse {

    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long assignedToId;
    private String assignedToName;
    private String assignedToEmail;
    private String title;
    private String description;
    private String dueDate;
    private String status;
    private int currentPhase;

    // Per-phase descriptions
    private String phase1Description;
    private String phase2Description;
    private String phase3Description;

    // Per-phase statuses
    private String phase1Status;
    private String phase2Status;
    private String phase3Status;

    // Per-phase employee submission notes
    private String phase1Note;
    private String phase2Note;
    private String phase3Note;

    // Per-phase manager feedback
    private String phase1Feedback;
    private String phase2Feedback;
    private String phase3Feedback;

    // Per-phase repo links
    private String phase1RepoLink;
    private String phase2RepoLink;
    private String phase3RepoLink;

    // Legacy fields
    private String submittedNote;
    private String managerFeedback;
    private String repositoryLink;
    private String createdAt;
    private String submittedAt;
    private String reviewedAt;

    public static TaskAssignmentResponse from(TaskAssignment t) {
        TaskAssignmentResponse r = new TaskAssignmentResponse();
        r.id              = t.getId();
        r.projectId       = t.getProject().getId();
        r.projectTitle    = t.getProject().getTitle();
        r.assignedToId    = t.getAssignedTo().getId();
        r.assignedToName  = t.getAssignedTo().getName();
        r.assignedToEmail = t.getAssignedTo().getEmail();
        r.title           = t.getTitle();
        r.description     = t.getDescription();
        r.dueDate         = t.getDueDate();
        r.status          = t.getStatus();
        r.currentPhase    = t.getCurrentPhase();

        r.phase1Description = t.getPhase1Description();
        r.phase2Description = t.getPhase2Description();
        r.phase3Description = t.getPhase3Description();

        r.phase1Status    = t.getPhase1Status();
        r.phase2Status    = t.getPhase2Status();
        r.phase3Status    = t.getPhase3Status();

        r.phase1Note      = t.getPhase1Note();
        r.phase2Note      = t.getPhase2Note();
        r.phase3Note      = t.getPhase3Note();

        r.phase1Feedback  = t.getPhase1Feedback();
        r.phase2Feedback  = t.getPhase2Feedback();
        r.phase3Feedback  = t.getPhase3Feedback();

        r.phase1RepoLink  = t.getPhase1RepoLink();
        r.phase2RepoLink  = t.getPhase2RepoLink();
        r.phase3RepoLink  = t.getPhase3RepoLink();

        r.submittedNote   = t.getSubmittedNote();
        r.managerFeedback = t.getManagerFeedback();
        r.repositoryLink  = t.getRepositoryLink();
        r.createdAt       = t.getCreatedAt() != null ? t.getCreatedAt().toString() : null;
        r.submittedAt     = t.getSubmittedAt() != null ? t.getSubmittedAt().toString() : null;
        r.reviewedAt      = t.getReviewedAt() != null ? t.getReviewedAt().toString() : null;
        return r;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId()                  { return id; }
    public Long getProjectId()           { return projectId; }
    public String getProjectTitle()      { return projectTitle; }
    public Long getAssignedToId()        { return assignedToId; }
    public String getAssignedToName()    { return assignedToName; }
    public String getAssignedToEmail()   { return assignedToEmail; }
    public String getTitle()             { return title; }
    public String getDescription()       { return description; }
    public String getDueDate()           { return dueDate; }
    public String getStatus()            { return status; }
    public int getCurrentPhase()         { return currentPhase; }

    public String getPhase1Description() { return phase1Description; }
    public String getPhase2Description() { return phase2Description; }
    public String getPhase3Description() { return phase3Description; }

    public String getPhase1Status()      { return phase1Status; }
    public String getPhase2Status()      { return phase2Status; }
    public String getPhase3Status()      { return phase3Status; }

    public String getPhase1Note()        { return phase1Note; }
    public String getPhase2Note()        { return phase2Note; }
    public String getPhase3Note()        { return phase3Note; }

    public String getPhase1Feedback()    { return phase1Feedback; }
    public String getPhase2Feedback()    { return phase2Feedback; }
    public String getPhase3Feedback()    { return phase3Feedback; }

    public String getPhase1RepoLink()    { return phase1RepoLink; }
    public String getPhase2RepoLink()    { return phase2RepoLink; }
    public String getPhase3RepoLink()    { return phase3RepoLink; }

    public String getSubmittedNote()     { return submittedNote; }
    public String getManagerFeedback()   { return managerFeedback; }
    public String getRepositoryLink()    { return repositoryLink; }
    public String getCreatedAt()         { return createdAt; }
    public String getSubmittedAt()       { return submittedAt; }
    public String getReviewedAt()        { return reviewedAt; }
}
