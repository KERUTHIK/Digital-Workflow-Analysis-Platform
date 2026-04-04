package com.nexusflow.dto;

import com.nexusflow.entity.Project;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProjectResponse {

    private Long id;
    private String title;
    private String description;
    private String clientName;
    private BigDecimal budget;
    private Integer progress;
    private Long createdById;
    private String createdByName;
    private Long teamId;
    private String teamName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String priority;

    public ProjectResponse() {}

    public ProjectResponse(Long id, String title, String description, String clientName, BigDecimal budget,
                           Integer progress, Long createdById, String createdByName,
                           Long teamId, String teamName, LocalDateTime createdAt, LocalDateTime updatedAt, String priority) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.clientName = clientName;
        this.budget = budget;
        this.progress = progress;
        this.createdById = createdById;
        this.createdByName = createdByName;
        this.teamId = teamId;
        this.teamName = teamName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.priority = priority;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public BigDecimal getBudget() { return budget; }
    public void setBudget(BigDecimal budget) { this.budget = budget; }

    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    // ── Static Factory ───────────────────────────────────────────────────────

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .clientName(project.getClientName())
                .budget(project.getBudget())
                .progress(project.getProgress())
                .createdById(project.getCreatedBy().getId())
                .createdByName(project.getCreatedBy().getName())
                .teamId(project.getAssignedTeam() != null ? project.getAssignedTeam().getId() : null)
                .teamName(project.getAssignedTeam() != null ? project.getAssignedTeam().getName() : null)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .priority(project.getPriority())
                .build();
    }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String title;
        private String description;
        private String clientName;
        private BigDecimal budget;
        private Integer progress;
        private Long createdById;
        private String createdByName;
        private Long teamId;
        private String teamName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String priority;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String d) { this.description = d; return this; }
        public Builder clientName(String cn) { this.clientName = cn; return this; }
        public Builder budget(BigDecimal budget) { this.budget = budget; return this; }
        public Builder progress(Integer progress) { this.progress = progress; return this; }
        public Builder createdById(Long id) { this.createdById = id; return this; }
        public Builder createdByName(String name) { this.createdByName = name; return this; }
        public Builder teamId(Long id) { this.teamId = id; return this; }
        public Builder teamName(String name) { this.teamName = name; return this; }
        public Builder createdAt(LocalDateTime t) { this.createdAt = t; return this; }
        public Builder updatedAt(LocalDateTime t) { this.updatedAt = t; return this; }
        public Builder priority(String p) { this.priority = p; return this; }

        public ProjectResponse build() {
            return new ProjectResponse(id, title, description, clientName, budget, progress, createdById, createdByName, teamId, teamName, createdAt, updatedAt, priority);
        }
    }
}
