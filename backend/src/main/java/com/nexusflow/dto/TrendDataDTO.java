package com.nexusflow.dto;

/**
 * Monthly trend data for charts.
 */
public class TrendDataDTO {
    private String name; // Month name (Jan, Feb, ...)
    private long projects;
    private long approvals;

    public TrendDataDTO() {}

    public TrendDataDTO(String name, long projects, long approvals) {
        this.name = name;
        this.projects = projects;
        this.approvals = approvals;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getProjects() { return projects; }
    public void setProjects(long projects) { this.projects = projects; }

    public long getApprovals() { return approvals; }
    public void setApprovals(long approvals) { this.approvals = approvals; }
}
