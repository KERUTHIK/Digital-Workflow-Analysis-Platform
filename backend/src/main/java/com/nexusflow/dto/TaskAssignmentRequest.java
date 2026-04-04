package com.nexusflow.dto;

public class TaskAssignmentRequest {

    private Long assignedToId;
    private String title;
    private String description;
    private String dueDate;

    // ── Per-phase descriptions (optional, set by manager at assignment time) ──
    private String phase1Description;
    private String phase2Description;
    private String phase3Description;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getAssignedToId()                           { return assignedToId; }
    public void setAssignedToId(Long assignedToId)          { this.assignedToId = assignedToId; }

    public String getTitle()                                { return title; }
    public void setTitle(String title)                      { this.title = title; }

    public String getDescription()                          { return description; }
    public void setDescription(String description)          { this.description = description; }

    public String getDueDate()                              { return dueDate; }
    public void setDueDate(String dueDate)                  { this.dueDate = dueDate; }

    public String getPhase1Description()                    { return phase1Description; }
    public void setPhase1Description(String phase1Description) { this.phase1Description = phase1Description; }

    public String getPhase2Description()                    { return phase2Description; }
    public void setPhase2Description(String phase2Description) { this.phase2Description = phase2Description; }

    public String getPhase3Description()                    { return phase3Description; }
    public void setPhase3Description(String phase3Description) { this.phase3Description = phase3Description; }
}
