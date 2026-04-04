import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  FolderKanban,
  Clock,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Flame,
  AlertCircle,
  Timer,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { TOKEN_KEY } from "../constants";
import { DonutChart } from "../components/DonutChart";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";

function KPICard({
  icon: Icon,
  title,
  value,
  sub,
  trend,
  trendUp,
  color,
  iconBg,
}: {
  icon: any;
  title: string;
  value: string;
  sub: string;
  trend: string;
  trendUp: boolean;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={18} className={color} />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-500"
            }`}
        >
          {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function AlertItem({
  type,
  title,
  detail,
  severity,
  time,
}: {
  type: string;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  time: string;
}) {
  const configs = {
    critical: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700" },
    high: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
    medium: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400", text: "text-blue-700" },
  };
  const cfg = configs[severity];
  const icons = { sla: Timer, budget: AlertCircle, escalation: Flame, overdue: AlertTriangle };
  const Icon = icons[type as keyof typeof icons] ?? AlertTriangle;

  return (
    <div className={`flex gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
      <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${cfg.text} bg-white border ${cfg.border}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold ${cfg.text} leading-tight`}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{detail}</p>
        <p className="text-[10px] text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const mId = user?.id ?? "";

  const [teamProjects, setTeamProjects] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [pendingTaskReviewsCount, setPendingTaskReviewsCount] = useState<number>(0);
  const [myTeam, setMyTeam] = useState<any[]>([]);
  const [analyticsLive, setAnalyticsLive] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      if (!isMounted) return;
      await fetchData();
    };

    runFetch();

    const handleFocus = () => {
      runFetch();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runFetch();
      }
    };

    const intervalId = window.setInterval(runFetch, 20000);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      setLoading(true);
      const token = localStorage.getItem(TOKEN_KEY);

      // Date range: last 6 months for a broad view
      const endD = new Date();
      const startD = new Date();
      startD.setMonth(endD.getMonth() - 6);
      const startDate = startD.toISOString().split("T")[0];
      const endDate = endD.toISOString().split("T")[0];

      const [projRes, appRes, teamRes, analyticsRes, taskReviewsRes, taskStatsRes, memberStatsRes] = await Promise.all([
        // Fetch ALL projects (large size so count matches Team Projects page)
        api.manager.getTeamProjects({ page: "0", size: "999" }),
        api.manager.getPendingApprovals(),
        fetch(`http://localhost:8080/api/manager/team`, { headers: { Authorization: `Bearer ${token}` } }),
        api.manager.getAnalytics({ startDate, endDate }),
        api.manager.getTaskReviews(),
        api.manager.getProjectTaskStats<any>(),
        api.manager.getTeamStats<any>()
      ]);

      const unmappedProjects = (projRes as any).content || [];
      const taskStats = taskStatsRes || {};
      const memberStatsMap = memberStatsRes || {};

      const mappedProjects = unmappedProjects.map((p: any) => {
        const projectStats = taskStats?.[p.id] || taskStats?.[String(p.id)];
        const totalTasks = Number(projectStats?.total) || 0;
        const completedTasks = Number(projectStats?.completed) || 0;
        const progress = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;
        return { ...p, progress };
      });

      setTeamProjects(mappedProjects);
      setApprovals(Array.isArray(appRes) ? appRes : []);
      setPendingTaskReviewsCount(Array.isArray(taskReviewsRes) ? taskReviewsRes.length : 0);
      setAnalyticsLive(analyticsRes as any);

      let teamData: any[] = [];
      if (teamRes.ok) {
        const teamJson = await teamRes.json();
        teamData = (teamJson.data || [])
          .filter((u: any) => String(u.id) !== String(mId)) // Filter out manager
          .map((u: any) => {
            const stats = memberStatsMap[u.id] || {};
            return {
              id: `U${u.id.toString().padStart(3, "0")}`,
              rawId: u.id,
              name: u.name,
              role: u.role,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
              managerId: mId,
              status: "Active",
              activeProjects: stats.active || 0,
              completedProjects: stats.completed || 0,
              slaCompliance: stats.slaCompliance || stats.approvalRate || 0,
            };
          });
      }
      setMyTeam(teamData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Derived list for workload chart (still uses myTeam state)
  const teamWithStats = myTeam;

  // ── Derived metrics from live analytics ─────────────────────────────────
  // Keep project approvals separate from task reviews so counts match their own pages.
  const pendingProjectApprovalsCount = approvals.length;

  const activeProjectsCountFromTeamStats = myTeam.reduce(
    (sum: number, member: any) => sum + (Number(member.activeProjects) || 0),
    0
  );
  const activeProjectsCountFromProgress = teamProjects.filter(
    (p: any) => p.progress > 0 && p.progress < 100
  ).length;
  const activeProjectsCount =
    activeProjectsCountFromTeamStats > 0
      ? activeProjectsCountFromTeamStats
      : activeProjectsCountFromProgress;

  const avgReviewHrs = analyticsLive?.avgApprovalHours ?? 0;
  const slaBreachRate = analyticsLive?.slaBreachRate ?? 0;
  const slaPercent = Math.round(100 - slaBreachRate);
  const overdueProjects = analyticsLive?.overdueCount ?? 0;

  const completedProjectsCount = teamProjects.filter((p: any) => p.progress === 100).length;
  const inProgressProjectsCount = Math.min(activeProjectsCount, teamProjects.length);
  const notStartedProjectsCount = Math.max(
    0,
    teamProjects.length - completedProjectsCount - inProgressProjectsCount
  );

  const donutData = [
    { name: "Completed", value: completedProjectsCount, color: "#10b981" },
    { name: "In Progress", value: inProgressProjectsCount, color: "#6366f1" },
    { name: "Not Started", value: notStartedProjectsCount, color: "#94a3b8" },
  ].filter((d: any) => d.value > 0);

  const totalProjectsCount = teamProjects.length;

  // Trend chart: monthly submission trend from live analytics
  const trendData = ((analyticsLive?.monthlyTrend ?? []) as any[]).map((d: any) => ({
    label: d.month,
    value: d.submissions,
  }));

  const workloadData = teamWithStats.map((m: any) => ({
    label: m.name.split(" ")[0],
    value: m.activeProjects,
    value2: m.completedProjects,
  }));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {greeting}, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 font-medium">{dateStr}</p>
        </div>
        {loading && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            <RefreshCw size={18} className="animate-spin text-slate-400" />
          </div>
        )}
        <Link
          to="/manager/approvals"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <CheckSquare size={16} />
          Review Approvals
          {pendingProjectApprovalsCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-emerald-700 text-[10px] font-bold">
              {pendingProjectApprovalsCount}
            </span>
          )}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard
          icon={CheckSquare} title="Pending Approvals" value={String(pendingTaskReviewsCount)}
          sub="Task approvals awaiting your review" trend={pendingTaskReviewsCount > 2 ? "+High" : "Normal"}
          trendUp={pendingTaskReviewsCount <= 2} color="text-amber-600" iconBg="bg-amber-50"
        />
        <KPICard
          icon={FolderKanban} title="Active Projects" value={String(activeProjectsCount)}
          sub="In your team's pipeline" trend={activeProjectsCount > 0 ? `${activeProjectsCount} active` : "None active"}
          trendUp={true} color="text-blue-600" iconBg="bg-blue-50"
        />
        <KPICard
          icon={Clock} title="Avg Review Time" value={avgReviewHrs > 0 ? `${avgReviewHrs}h` : "0h"}
          sub="Last 6-month average" trend={avgReviewHrs <= 24 ? "On target" : "Slow"}
          trendUp={avgReviewHrs <= 24} color="text-indigo-600" iconBg="bg-indigo-50"
        />
        <KPICard
          icon={ShieldAlert} title="SLA Compliance" value={`${slaPercent}%`}
          sub={`${slaPercent}% of approvals on track`} trend={slaPercent >= 85 ? "+Good" : "Below target"}
          trendUp={slaPercent >= 85} color="text-emerald-600" iconBg="bg-emerald-50"
        />
        <KPICard
          icon={AlertTriangle} title="Overdue Projects" value={String(overdueProjects)}
          sub="SLA breached" trend={overdueProjects > 0 ? "Action needed" : "All clear"}
          trendUp={overdueProjects === 0} color="text-red-600" iconBg="bg-red-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donut – Project Status (ALL projects from DB) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Project Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your team's projects</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{totalProjectsCount} total</span>
          </div>
          {loading ? (
            <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
          ) : (
            <DonutChart segments={donutData} size={160} thickness={22}
              centerLabel={String(totalProjectsCount)} centerSub="Projects" />
          )}
        </div>

        {/* Line – Monthly Submission Trend (from live analytics) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Monthly Submission Trend</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submissions per month (last 6 months)</p>
          </div>
          {loading ? (
            <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
          ) : trendData.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-slate-400">No trend data available</div>
          ) : (
            <LineChart data={trendData} color="#6366f1" label="Submissions" unit="" height={150} />
          )}
        </div>

        {/* Bar – Team Workload (real active vs completed) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Team Workload</h2>
            <p className="text-xs text-slate-400 mt-0.5">Active vs completed projects per member</p>
          </div>
          {loading ? (
            <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
          ) : workloadData.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-slate-400">No workload data</div>
          ) : (
            <BarChart data={workloadData} color="#10b981" color2="#d1fae5"
              label="Active" label2="Completed" height={150} />
          )}
        </div>
      </div>

      {/* Bottom: Team Members + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:col-span-3 lg:grid-cols-3">
        {/* Team Members */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">My Team</h2>
              <p className="text-xs text-slate-400 mt-0.5">{myTeam.length} members reporting to you</p>
            </div>
            <Link to="/manager/team" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              View projects <ArrowRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Member", "Role", "Active", "Completed", "SLA", "Status"].map((h: string) => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamWithStats.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <img src={m.avatar} alt={m.name} className="h-7 w-7 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                        <span className="font-medium text-slate-800 text-xs whitespace-nowrap">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">{m.role}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{m.activeProjects}</span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{m.completedProjects}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.slaCompliance >= 80 ? "bg-emerald-500" : m.slaCompliance >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${m.slaCompliance}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{m.slaCompliance}%</span>
                      </div>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts – based on live data */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Alerts & Warnings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Items requiring attention</p>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
              {pendingProjectApprovalsCount + (slaBreachRate > 50 ? 1 : 0)}
            </span>
          </div>
          <div className="space-y-2.5">
            {pendingProjectApprovalsCount > 0 && (
              <AlertItem
                type="sla"
                title={`${pendingProjectApprovalsCount} project${pendingProjectApprovalsCount > 1 ? "s" : ""} awaiting approval`}
                detail="Review pending submissions in the approvals queue."
                severity="high"
                time="Now"
              />
            )}
            {slaBreachRate > 50 && (
              <AlertItem
                type="overdue"
                title={`SLA breach rate is ${Math.round(slaBreachRate)}%`}
                detail="More than half of recent approvals exceeded their SLA deadline."
                severity="critical"
                time="Last 6 months"
              />
            )}
            {pendingProjectApprovalsCount === 0 && slaBreachRate <= 50 && (
              <div className="py-8 text-center text-xs text-slate-400">
                All clear — no active alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
