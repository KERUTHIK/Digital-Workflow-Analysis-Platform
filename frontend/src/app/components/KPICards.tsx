import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  Briefcase,
  FileCheck,
  AlertCircle,
  Clock,
  Zap
} from "lucide-react";

interface KPICardsProps {
  overviewData: any;
  loading: boolean;
}

function formatTrendValue(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const sign = v > 0 ? "+" : "";
    return `${sign}${v}%`;
  }
  return String(v);
}

export function KPICards({ overviewData, loading }: KPICardsProps) {
  if (loading || !overviewData) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = {
    totalUsers: overviewData.totalUsers || 0,
    totalProjects: overviewData.totalProjects || 0,
    pendingProjects: overviewData.pendingApprovals || 0,
    activeWorkflows: overviewData.activeWorkflows || 0,
    avgCompletion: overviewData.avgApprovalTime || "0d",
    efficiencyIdx: overviewData.slaCompliance || 0
  };

  const kpis = [
    {
      title: "Total Users",
      value: String(stats.totalUsers),
      trend: formatTrendValue(overviewData.totalUsersTrend ?? overviewData.totalUsersChange),
      trendDirection: "up",
      trendStatus: "positive",
      color: "bg-blue-50 text-blue-600",
      icon: Users,
      subtitle: "Across all departments"
    },
    {
      title: "Total Projects",
      value: String(stats.totalProjects),
      trend: formatTrendValue(overviewData.totalProjectsTrend ?? overviewData.totalProjectsChange),
      trendDirection: "up",
      trendStatus: "positive",
      color: "bg-emerald-50 text-emerald-600",
      icon: Briefcase,
      subtitle: "Platform-wide volume"
    },
    {
      title: "Pending Reviews",
      value: String(stats.pendingProjects),
      trend: formatTrendValue(overviewData.pendingApprovalsTrend ?? overviewData.pendingApprovalsChange),
      trendDirection: "down",
      trendStatus: "positive",
      color: "bg-amber-50 text-amber-600",
      icon: FileCheck,
      subtitle: "Awaiting manager action"
    },
    {
      title: "Active Workflows",
      value: String(stats.activeWorkflows),
      trend: formatTrendValue(overviewData.activeWorkflowsTrend ?? overviewData.activeWorkflowsChange),
      trendDirection: "none",
      trendStatus: "neutral",
      color: "bg-indigo-50 text-indigo-600",
      icon: Zap,
      subtitle: "Configured processes"
    },
    {
      title: "Avg Completion",
      value: stats.avgCompletion,
      trend: formatTrendValue(overviewData.avgApprovalTimeTrend ?? overviewData.avgApprovalTimeChange),
      trendDirection: "down",
      trendStatus: "positive",
      color: "bg-violet-50 text-violet-600",
      icon: Clock,
      subtitle: "Platforms average"
    },
    {
      title: "Efficiency Index",
      value: `${stats.efficiencyIdx}%`,
      trend: formatTrendValue(overviewData.slaComplianceTrend ?? overviewData.slaComplianceChange),
      trendDirection: "up",
      trendStatus: "positive",
      color: "bg-rose-50 text-rose-600",
      icon: AlertCircle,
      subtitle: "SLA compliance rate"
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        const isUp = kpi.trendDirection === "up";
        const isDown = kpi.trendDirection === "down";
        const isPositive = kpi.trendStatus === "positive";
        const isNegative = kpi.trendStatus === "negative";

        const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

        const trendColor = isPositive
          ? "text-emerald-600"
          : isNegative
            ? "text-red-600"
            : "text-slate-500";

        return (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={`rounded-lg p-2.5 ${kpi.color}`}>
                <Icon size={20} strokeWidth={2.5} />
              </div>
              {kpi.trend ? (
                <span className={`flex items-center text-xs font-semibold ${trendColor}`}>
                  {kpi.trend}
                  <TrendIcon size={14} className="ml-1" />
                </span>
              ) : null}
            </div>

            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{kpi.value}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{kpi.title}</p>
            <p className="mt-2 text-[10px] text-slate-400">{kpi.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
