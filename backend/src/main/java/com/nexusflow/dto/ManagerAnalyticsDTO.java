package com.nexusflow.dto;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for the manager analytics endpoint.
 * All numeric fields default to 0 or empty lists so the frontend never
 * receives nulls — making empty-state handling straightforward.
 */
public class ManagerAnalyticsDTO {

    /** Month-by-month project submissions and approvals. */
    private List<Map<String, Object>> monthlyTrend;

    /** Average hours from approval creation to action in the date range. */
    private double avgApprovalHours;

    /** Percentage of total team projects that were approved. */
    private double approvalRate;

    /** Percentage of team projects whose SLA was breached. */
    private double slaBreachRate;

    /** Percentage of total team projects that were rejected. */
    private double rejectionRate;

    /** Computed efficiency score 0-100. */
    private int efficiencyScore;

    /** Computed team performance index 0-100. */
    private int teamPerformanceIndex;

    /** Total project submissions in range. */
    private long totalSubmissions;

    /** Total approvals in range. */
    private long totalApproved;

    // ── Getters & Setters ────────────────────────────────────────────────────

    public List<Map<String, Object>> getMonthlyTrend()               { return monthlyTrend; }
    public void setMonthlyTrend(List<Map<String, Object>> t)         { this.monthlyTrend = t; }

    public double getAvgApprovalHours()                               { return avgApprovalHours; }
    public void setAvgApprovalHours(double v)                        { this.avgApprovalHours = v; }

    public double getApprovalRate()                                   { return approvalRate; }
    public void setApprovalRate(double v)                            { this.approvalRate = v; }

    public double getSlaBreachRate()                                  { return slaBreachRate; }
    public void setSlaBreachRate(double v)                           { this.slaBreachRate = v; }

    public double getRejectionRate()                                  { return rejectionRate; }
    public void setRejectionRate(double v)                           { this.rejectionRate = v; }

    public int getEfficiencyScore()                                   { return efficiencyScore; }
    public void setEfficiencyScore(int v)                            { this.efficiencyScore = v; }

    public int getTeamPerformanceIndex()                              { return teamPerformanceIndex; }
    public void setTeamPerformanceIndex(int v)                       { this.teamPerformanceIndex = v; }

    public long getTotalSubmissions()                                 { return totalSubmissions; }
    public void setTotalSubmissions(long v)                          { this.totalSubmissions = v; }

    public long getTotalApproved()                                    { return totalApproved; }
    public void setTotalApproved(long v)                             { this.totalApproved = v; }
}
