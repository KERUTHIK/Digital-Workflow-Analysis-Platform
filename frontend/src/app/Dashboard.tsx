import React, { useState, useEffect } from "react";
import { api } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { KPICards } from "./components/KPICards";
import { TrendCards } from "./components/TrendCards";
import { DashboardCharts } from "./components/DashboardCharts";
import { ManagerTable } from "./components/ManagerTable";
import { RiskPanel } from "./components/RiskPanel";

const FILTER_OPTIONS = [
  { label: "Last 30 Days", key: "30d", days: 30 },
  { label: "Last 90 Days", key: "90d", days: 90 },
  { label: "Year to Date", key: "ytd", days: 365 },
];

function getRange(days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("30d");
  const [overviewData, setOverviewData] = useState(null as any);
  const [analyticsData, setAnalyticsData] = useState(null as any);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Overview is global
  useEffect(() => {
    api.statistics.getOverview()
      .then((res: any) => setOverviewData(res))
      .catch((err: any) => console.error("Overview failed:", err))
      .finally(() => setOverviewLoading(false));
  }, []);

  // Analytics reloads when filter changes
  useEffect(() => {
    const preset = FILTER_OPTIONS.find((f) => f.key === filter)!;
    const { startDate, endDate } = getRange(preset.days);
    setAnalyticsLoading(true);
    api.statistics.getAdminAnalytics({ startDate, endDate })
      .then((res: any) => setAnalyticsData(res))
      .catch((err: any) => console.error("Admin analytics failed:", err))
      .finally(() => setAnalyticsLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500">
            Welcome back, {user?.name || "User"}. Here's what's happening today.
          </p>
        </div>

        {/* Date filter shifted here for global control */}
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-fit">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm text-slate-700 font-medium bg-transparent border-none outline-none cursor-pointer pr-1"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Trend Cards Section */}
      <TrendCards overviewData={overviewData} loading={overviewLoading} />

      {/* KPI Cards */}
      <KPICards overviewData={overviewData} loading={overviewLoading} />

      {/* Charts Section */}
      <DashboardCharts
        overviewData={overviewData}
        analyticsData={analyticsData}
        loading={analyticsLoading}
      />

      {/* Bottom Section: Manager Table & Risk Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ManagerTable managers={analyticsData?.managers || []} loading={analyticsLoading} />
        </div>
        <div>
          <RiskPanel risks={overviewData?.slaBreachedProjects || []} loading={overviewLoading} />
        </div>
      </div>
    </div>
  );
}
