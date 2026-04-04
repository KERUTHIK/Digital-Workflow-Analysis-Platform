package com.nexusflow.dto;

import java.util.List;
import java.util.Map;

/**
 * Combined DTO for dashboard overview metrics.
 */
public class DashboardStatsDTO {

    private long totalProjects;
    private long pendingApprovals;
    private long totalUsers;
    private long activeWorkflows;
    private double approvalRate;
    private double slaCompliance;
    private String avgApprovalTime;
    private String budgetUtilization;
    private List<TrendDataDTO> monthlyTrends;
    private Map<String, Long> statusDistribution;
    private List<Map<String, Object>> slaBreachesPerStage;
    private List<Map<String, Object>> slaTrendData;
    private List<Map<String, Object>> slaBreachedProjects;

    public DashboardStatsDTO() {}

    // Getters and Setters
    public Map<String, Long> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(Map<String, Long> statusDistribution) { this.statusDistribution = statusDistribution; }

    public List<Map<String, Object>> getSlaBreachesPerStage() { return slaBreachesPerStage; }
    public void setSlaBreachesPerStage(List<Map<String, Object>> slaBreachesPerStage) { this.slaBreachesPerStage = slaBreachesPerStage; }

    public List<Map<String, Object>> getSlaTrendData() { return slaTrendData; }
    public void setSlaTrendData(List<Map<String, Object>> slaTrendData) { this.slaTrendData = slaTrendData; }

    public List<Map<String, Object>> getSlaBreachedProjects() { return slaBreachedProjects; }
    public void setSlaBreachedProjects(List<Map<String, Object>> slaBreachedProjects) { this.slaBreachedProjects = slaBreachedProjects; }

    // Getters and Setters
    public long getTotalProjects() { return totalProjects; }
    public void setTotalProjects(long totalProjects) { this.totalProjects = totalProjects; }

    public long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(long pendingApprovals) { this.pendingApprovals = pendingApprovals; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getActiveWorkflows() { return activeWorkflows; }
    public void setActiveWorkflows(long activeWorkflows) { this.activeWorkflows = activeWorkflows; }

    public double getApprovalRate() { return approvalRate; }
    public void setApprovalRate(double approvalRate) { this.approvalRate = approvalRate; }

    public double getSlaCompliance() { return slaCompliance; }
    public void setSlaCompliance(double slaCompliance) { this.slaCompliance = slaCompliance; }

    public String getAvgApprovalTime() { return avgApprovalTime; }
    public void setAvgApprovalTime(String avgApprovalTime) { this.avgApprovalTime = avgApprovalTime; }

    public String getBudgetUtilization() { return budgetUtilization; }
    public void setBudgetUtilization(String budgetUtilization) { this.budgetUtilization = budgetUtilization; }

    public List<TrendDataDTO> getMonthlyTrends() { return monthlyTrends; }
    public void setMonthlyTrends(List<TrendDataDTO> monthlyTrends) { this.monthlyTrends = monthlyTrends; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private DashboardStatsDTO dto = new DashboardStatsDTO();

        public Builder totalProjects(long t) { dto.setTotalProjects(t); return this; }
        public Builder pendingApprovals(long p) { dto.setPendingApprovals(p); return this; }
        public Builder totalUsers(long u) { dto.setTotalUsers(u); return this; }
        public Builder activeWorkflows(long w) { dto.setActiveWorkflows(w); return this; }
        public Builder approvalRate(double r) { dto.setApprovalRate(r); return this; }
        public Builder slaCompliance(double s) { dto.setSlaCompliance(s); return this; }
        public Builder avgApprovalTime(String t) { dto.setAvgApprovalTime(t); return this; }
        public Builder budgetUtilization(String b) { dto.setBudgetUtilization(b); return this; }
        public Builder monthlyTrends(List<TrendDataDTO> m) { dto.setMonthlyTrends(m); return this; }

        public DashboardStatsDTO build() { return dto; }
    }
}
