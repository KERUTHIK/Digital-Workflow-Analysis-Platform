package com.nexusflow.controller;

import com.nexusflow.dto.DashboardStatsDTO;
import com.nexusflow.dto.TrendDataDTO;
import com.nexusflow.entity.Approval;
import com.nexusflow.entity.Project;
import com.nexusflow.entity.Role;
import com.nexusflow.entity.User;
import com.nexusflow.exception.ApiResponse;
import com.nexusflow.repository.ApprovalRepo;
import com.nexusflow.repository.ProjectRepository;
import com.nexusflow.repository.TaskAssignmentRepository;
import com.nexusflow.repository.UserRepository;
import com.nexusflow.repository.WorkflowTemplateRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final ProjectRepository projectRepository;
    private final ApprovalRepo approvalRepo;
    private final UserRepository userRepository;
    private final WorkflowTemplateRepository workflowTemplateRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;

    public StatisticsController(ProjectRepository projectRepository,
                                ApprovalRepo approvalRepo,
                                UserRepository userRepository,
                                WorkflowTemplateRepository workflowTemplateRepository,
                                TaskAssignmentRepository taskAssignmentRepository) {
        this.projectRepository = projectRepository;
        this.approvalRepo = approvalRepo;
        this.userRepository = userRepository;
        this.workflowTemplateRepository = workflowTemplateRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getOverview() {
        LocalDateTime yearStart = LocalDate.now().withDayOfYear(1).atStartOfDay();
        long total = projectRepository.count();
        long approved = projectRepository.findAllApprovedFromYearStart(yearStart).size();
        long pendingCount = total - approved; 
        long totalUsers = userRepository.count();
        long activeWorkflows = workflowTemplateRepository.count();
        double rate = total > 0 ? (double) approved / total * 100 : 0;

        List<Project> yearProjects = projectRepository.findAllFromYearStart(yearStart);
        List<Project> yearApproved = projectRepository.findAllApprovedFromYearStart(yearStart);

        Map<Integer, Long> pMap = yearProjects.stream()
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().getMonthValue(), Collectors.counting()));
        Map<Integer, Long> aMap = yearApproved.stream()
                .collect(Collectors.groupingBy(p -> p.getUpdatedAt().getMonthValue(), Collectors.counting()));

        List<TrendDataDTO> trends = new ArrayList<TrendDataDTO>();
        for (int i = 1; i <= 12; i++) {
            String monthName = Month.of(i).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            trends.add(new TrendDataDTO(monthName, pMap.getOrDefault(i, 0L), aMap.getOrDefault(i, 0L)));
        }

        Map<String, Long> statusDist = new HashMap<String, Long>();
        statusDist.put("Completed", approved);
        statusDist.put("In Progress", total - approved);

        long completedCount = approvalRepo.countCompletedApprovals();
        long onTimeCount = approvalRepo.countOnTimeApprovals();
        double slaCompliance = completedCount > 0 ? (double) onTimeCount / completedCount * 100 : 100.0;

        Double avgHrs = approvalRepo.getGlobalAvgApprovalHours();
        String avgTimeFormatted = "0h";
        if (avgHrs != null && avgHrs > 0) {
            long totalMinutes = Math.round(avgHrs * 60);
            long h = totalMinutes / 60;
            long m = totalMinutes % 60;
            avgTimeFormatted = h + "h " + m + "m";
        }

        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .totalProjects(total)
                .pendingApprovals(pendingCount)
                .totalUsers(totalUsers)
                .activeWorkflows(activeWorkflows)
                .approvalRate(Math.round(rate * 10.0) / 10.0)
                .slaCompliance(Math.round(slaCompliance * 10.0) / 10.0)
                .avgApprovalTime(avgTimeFormatted)
                .budgetUtilization("$0.0M")
                .monthlyTrends(trends)
                .build();
        stats.setStatusDistribution(statusDist);

        LocalDateTime now = LocalDateTime.now();
        List<Approval> breachedApprovals = approvalRepo.findBreachedApprovals(now);

        List<Map<String, Object>> breachedProjs = new ArrayList<Map<String, Object>>();
        Map<String, Integer> stageBreachCounts = new HashMap<String, Integer>();

        for (Approval a : breachedApprovals) {
            long delayHrs = Duration.between(a.getSlaDeadline(), now).toHours();
            String escalation = delayHrs > 48 ? "L3" : delayHrs > 24 ? "L2" : "L1";
            
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", "PRJ-" + String.format("%03d", a.getProject().getId()));
            item.put("projectName", a.getProject().getTitle());
            item.put("stage", "Processing");
            item.put("assignedTo", a.getReviewer().getName());
            item.put("slaDeadline", a.getSlaDeadline().toString());
            item.put("delayHours", delayHrs);
            item.put("delayDuration", delayHrs + "h");
            item.put("escalationLevel", escalation);
            breachedProjs.add(item);

            String stage = "Processing";
            stageBreachCounts.merge(stage, 1, Integer::sum);
        }
        stats.setSlaBreachedProjects(breachedProjs);

        List<Map<String, Object>> slaPerStage = new ArrayList<Map<String, Object>>();
        for (Map.Entry<String, Integer> entry : stageBreachCounts.entrySet()) {
            Map<String, Object> sItem = new LinkedHashMap<String, Object>();
            sItem.put("stage", entry.getKey());
            sItem.put("breaches", entry.getValue());
            slaPerStage.add(sItem);
        }
        if (slaPerStage.isEmpty()) {
            Map<String, Object> sItem = new LinkedHashMap<String, Object>();
            sItem.put("stage", "No Breaches");
            sItem.put("breaches", 0);
            slaPerStage.add(sItem);
        }
        stats.setSlaBreachesPerStage(slaPerStage);

        LocalDateTime sixMonthsAgo = now.minusMonths(6).withDayOfMonth(1).toLocalDate().atStartOfDay();
        List<Object[]> globalSlaTrend = approvalRepo.getGlobalSlaBreachTrend(sixMonthsAgo);
        Map<Integer, Long> slaMap = new HashMap<Integer, Long>();
        for (Object[] row : globalSlaTrend) {
            slaMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        List<Map<String, Object>> slaTrendData = new ArrayList<Map<String, Object>>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime mDate = now.minusMonths(i);
            int mVal = mDate.getMonthValue();
            String mName = mDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            
            Map<String, Object> point = new HashMap<String, Object>();
            point.put("month", mName);
            point.put("breaches", slaMap.getOrDefault(mVal, 0L));
            slaTrendData.add(point);
        }
        stats.setSlaTrendData(slaTrendData);

        return ResponseEntity.ok(ApiResponse.success(stats, "Statistics retrieved successfully"));
    }

    @GetMapping("/admin-analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = (endDate != null) ? endDate.atTime(23, 59, 59) : now;
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : now.minusDays(30);

        LocalDateTime yearStart = LocalDate.now().withDayOfYear(1).atStartOfDay();
        List<Project> yearProjects = projectRepository.findAllFromYearStart(yearStart);
        List<Project> yearApproved = projectRepository.findAllApprovedFromYearStart(yearStart);

        Map<Integer, Long> pMap = yearProjects.stream()
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().getMonthValue(), Collectors.counting()));
        Map<Integer, Long> aMap = yearApproved.stream()
                .collect(Collectors.groupingBy(p -> p.getUpdatedAt().getMonthValue(), Collectors.counting()));

        YearMonth startYM = YearMonth.from(start);
        YearMonth endYM = YearMonth.from(end);
        List<Map<String, Object>> monthlyTrends = new ArrayList<Map<String, Object>>();
        for (YearMonth ym = startYM; !ym.isAfter(endYM); ym = ym.plusMonths(1)) {
            int m = ym.getMonthValue();
            Map<String, Object> row = new LinkedHashMap<String, Object>();
            row.put("name", ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            row.put("projects", pMap.getOrDefault(m, 0L));
            row.put("approvals", aMap.getOrDefault(m, 0L));
            monthlyTrends.add(row);
        }

        List<Approval> completed = approvalRepo.findCompletedApprovals(start, end);

        Map<Long, List<Approval>> byReviewer = completed.stream()
                .filter(a -> a.getReviewer() != null)
                .collect(Collectors.groupingBy(a -> a.getReviewer().getId()));

        List<User> managers = userRepository.findByRole(Role.MANAGER);
        List<Map<String, Object>> managersPerf = new ArrayList<Map<String, Object>>();
        double totalAvgHrs = 0;
        double totalSla = 0;
        int managerCount = 0;

        for (User mgr : managers) {
            List<Approval> mgrApprovals = byReviewer.getOrDefault(mgr.getId(), Collections.emptyList());

            double avgHrs = mgrApprovals.stream()
                    .filter(a -> a.getCreatedAt() != null && a.getActionTime() != null)
                    .mapToLong(a -> Duration.between(a.getCreatedAt(), a.getActionTime()).toHours())
                    .average()
                    .orElse(0.0);
            avgHrs = Math.round(avgHrs * 10.0) / 10.0;

            long reviewed = mgrApprovals.size();

            long onTime = mgrApprovals.stream()
                    .filter(a -> a.getActionTime() != null && a.getSlaDeadline() != null
                            && !a.getActionTime().isAfter(a.getSlaDeadline()))
                    .count();
            double slaPercent = reviewed > 0 ? Math.round(onTime * 1000.0 / reviewed) / 10.0 : 100.0;

            int efficiency = (int) Math.round(((avgHrs > 0 ? Math.max(0, 100 - avgHrs * 1.5) : 80) * 0.4) + (slaPercent * 0.3) + (Math.min(100, reviewed * 10L) * 0.3));
            efficiency = Math.min(100, Math.max(0, efficiency));

            String avgTimeStr = avgHrs >= 24 ? String.format("%.1fd", avgHrs / 24) : String.format("%.1fh", avgHrs);

            Map<String, Object> m = new LinkedHashMap<String, Object>();
            m.put("id", mgr.getId());
            m.put("name", mgr.getName());
            m.put("role", "Manager");
            m.put("department", mgr.getDepartment() != null ? mgr.getDepartment() : "General");
            m.put("avatar", "https://api.dicebear.com/7.x/avataaars/svg?seed=" + mgr.getId());
            m.put("reviewed", reviewed);
            m.put("avgTimeHours", avgHrs);
            m.put("avgTime", avgTimeStr);
            m.put("sla", slaPercent);
            m.put("efficiency", efficiency);
            m.put("status", efficiency >= 80 ? "Good" : efficiency >= 60 ? "Average" : "Poor");
            managersPerf.add(m);

            totalAvgHrs += avgHrs;
            totalSla += slaPercent;
            managerCount++;
        }

        managersPerf.sort(new Comparator<Map<String, Object>>() {
            @Override
            public int compare(Map<String, Object> a, Map<String, Object> b) {
                return Double.compare(
                        ((Number) b.get("efficiency")).doubleValue(),
                        ((Number) a.get("efficiency")).doubleValue());
            }
        });

        double overallAvgHrs = managerCount > 0 ? Math.round(totalAvgHrs / managerCount * 10.0) / 10.0 : 0;
        double overallSla = managerCount > 0 ? Math.round(totalSla / managerCount * 10.0) / 10.0 : 0;

        List<Map<String, Object>> bottlenecks = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> m : managersPerf) {
            if (((Number) m.get("reviewed")).longValue() > 0) {
                Map<String, Object> b = new LinkedHashMap<String, Object>();
                b.put("stage", m.get("name"));
                b.put("time", m.get("avgTimeHours"));
                bottlenecks.add(b);
            }
        }
        bottlenecks.sort(new Comparator<Map<String, Object>>() {
            @Override
            public int compare(Map<String, Object> a, Map<String, Object> b) {
                return Double.compare(
                        ((Number) b.get("time")).doubleValue(),
                        ((Number) a.get("time")).doubleValue());
            }
        });

        Map<String, List<Approval>> byDept = completed.stream()
                .filter(a -> a.getReviewer() != null && a.getReviewer().getDepartment() != null)
                .collect(Collectors.groupingBy(a -> a.getReviewer().getDepartment()));

        List<Map<String, Object>> deptDelays = new ArrayList<Map<String, Object>>();
        for (Map.Entry<String, List<Approval>> entry : byDept.entrySet()) {
            double avgDelay = entry.getValue().stream()
                    .filter(a -> a.getProject() != null && a.getProject().getCreatedAt() != null && a.getActionTime() != null)
                    .mapToLong(a -> Duration.between(a.getProject().getCreatedAt(), a.getActionTime()).toHours())
                    .average()
                    .orElse(0.0);
            Map<String, Object> d = new LinkedHashMap<String, Object>();
            d.put("department", entry.getKey());
            d.put("delay", Math.round(avgDelay * 10.0) / 10.0);
            deptDelays.add(d);
        }
        deptDelays.sort(new Comparator<Map<String, Object>>() {
            @Override
            public int compare(Map<String, Object> a, Map<String, Object> b) {
                return Double.compare(((Number) b.get("delay")).doubleValue(), ((Number) a.get("delay")).doubleValue());
            }
        });

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("monthlyTrends", monthlyTrends);
        result.put("managers", managersPerf);
        result.put("managerCount", managerCount);
        result.put("overallAvgHrs", overallAvgHrs);
        result.put("overallSla", overallSla);
        result.put("bottlenecks", bottlenecks);
        result.put("departmentDelays", deptDelays);
        result.put("startDate", start.toLocalDate().toString());
        result.put("endDate", end.toLocalDate().toString());

        return ResponseEntity.ok(ApiResponse.success(result, "Admin analytics retrieved successfully"));
    }

    @GetMapping("/employee-analytics")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmployeeAnalytics(
            @AuthenticationPrincipal User loggedInUser) {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sixMonthsAgo = now.minusMonths(6).withDayOfMonth(1).toLocalDate().atStartOfDay();
        Long managerScopeId = loggedInUser.getManager() != null
                ? loggedInUser.getManager().getId()
                : loggedInUser.getId();

        // ── Task submission trend (last 6 months) ─────────────────────────────
        List<Object[]> taskTrendRaw = taskAssignmentRepository.getMonthlyTaskCountsByAssignedToIdAndRange(
                loggedInUser.getId(), sixMonthsAgo, now);
        Map<Integer, Long> taskTrendMap = new HashMap<Integer, Long>();
        if (taskTrendRaw != null) {
            for (Object[] row : taskTrendRaw) {
                taskTrendMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }
        }

        // ── Project creation trend (last 6 months) ────────────────────────────
        List<Object[]> projTrendRaw = projectRepository.getMonthlyProjectCountsByManagerAndRange(
                managerScopeId, sixMonthsAgo, now);
        Map<Integer, Long> projTrendMap = new HashMap<Integer, Long>();
        if (projTrendRaw != null) {
            for (Object[] row : projTrendRaw) {
                projTrendMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }
        }

        List<Map<String, Object>> taskSubmissionTrend = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> projectTrend = new ArrayList<Map<String, Object>>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime mDate = now.minusMonths(i);
            int mVal = mDate.getMonthValue();
            String mName = mDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            Map<String, Object> tp = new LinkedHashMap<String, Object>();
            tp.put("month", mName);
            tp.put("count", taskTrendMap.getOrDefault(mVal, 0L));
            taskSubmissionTrend.add(tp);

            Map<String, Object> pp = new LinkedHashMap<String, Object>();
            pp.put("month", mName);
            pp.put("count", projTrendMap.getOrDefault(mVal, 0L));
            projectTrend.add(pp);
        }

        // ── Project status breakdown ───────────────────────────────────────────
        List<Project> myProjects = projectRepository.findAllByCreatedByManagerId(managerScopeId);
        long totalSubmitted = myProjects.size();
        long totalApproved  = myProjects.stream().filter(p -> p.getProgress() == 100).count();
        long totalPending   = myProjects.stream().filter(p -> p.getProgress() > 0 && p.getProgress() < 100).count();
        long totalDraft     = myProjects.stream().filter(p -> p.getProgress() == 0).count();
        long totalRejected  = 0;

        double approvalRate = totalSubmitted > 0
                ? Math.round((double) totalApproved / totalSubmitted * 1000.0) / 10.0 : 0.0;
        double rejectionRate = totalSubmitted > 0
                ? Math.round((double) totalRejected / totalSubmitted * 1000.0) / 10.0 : 0.0;

        // ── Task stats ─────────────────────────────────────────────────────────
        var myTasks = taskAssignmentRepository.findByAssignedToId(loggedInUser.getId());
        long taskTotal       = myTasks.size();
        long taskCompleted   = myTasks.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
        long taskPending     = myTasks.stream().filter(t -> "PENDING".equals(t.getStatus())).count();
        long taskRejected    = myTasks.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();
        long taskUnderReview = myTasks.stream().filter(t -> "UNDER_REVIEW".equals(t.getStatus())).count();
        double taskApprovalRate = taskTotal > 0
                ? Math.round((double) taskCompleted / taskTotal * 1000.0) / 10.0 : 0.0;

        // ── Avg processing time ────────────────────────────────────────────────
        Double avgHrs = approvalRepo.getAvgApprovalHoursByManagerAndRange(managerScopeId, sixMonthsAgo, now);
        double avgDays = 0.0;
        if (avgHrs != null && avgHrs > 0) {
            avgDays = Math.round((avgHrs / 24.0) * 10.0) / 10.0;
        }

        // ── Performance score ──────────────────────────────────────────────────
        int perfScore = (int) Math.min(100, Math.round(
                approvalRate * 0.4 + taskApprovalRate * 0.3
                + (totalSubmitted > 0 ? Math.min(30, totalSubmitted * 3L) : 0)
        ));

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("submissionTrend", taskSubmissionTrend);
        result.put("projectTrend", projectTrend);
        result.put("avgProcessingDays", avgDays);
        result.put("totalSubmitted", totalSubmitted);
        result.put("totalApproved", totalApproved);
        result.put("totalPending", totalPending);
        result.put("totalRejected", totalRejected);
        result.put("totalDraft", totalDraft);
        result.put("approvalRate", approvalRate);
        result.put("rejectionRate", rejectionRate);
        result.put("taskTotal", taskTotal);
        result.put("taskCompleted", taskCompleted);
        result.put("taskPending", taskPending);
        result.put("taskRejected", taskRejected);
        result.put("taskUnderReview", taskUnderReview);
        result.put("taskApprovalRate", taskApprovalRate);
        result.put("performanceScore", perfScore);

        return ResponseEntity.ok(ApiResponse.success(result, "Employee analytics retrieved successfully"));
    }
}
