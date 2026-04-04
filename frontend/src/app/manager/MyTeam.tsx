import {
  Award,
  Star,
  AlertCircle,
  FolderKanban,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { type TeamMember } from "./mockData";
import { TOKEN_KEY } from "../constants";
import { api } from "../services/api";



// ── Mini trend sparkline ──────────────────────────────────────────────────────
function Sparkline({
  data,
  color,
}: {
  data: { submitted: number; approved: number }[];
  color: string;
}) {
  if (!Array.isArray(data) || data.length < 2) {
    return <span className="text-[10px] text-slate-400">No trend</span>;
  }

  const W = 80;
  const H = 28;
  const vals = data.map((d) => d.approved);
  const max = Math.max(...vals, 1);
  const xStep = (W - 4) / (vals.length - 1);

  const pts = vals
    .map((v, i) => `${2 + i * xStep},${H - 4 - (v / max) * (H - 8)}`)
    .join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {vals.map((v, i) => (
        <circle
          key={i}
          cx={2 + i * xStep}
          cy={H - 4 - (v / max) * (H - 8)}
          r="2"
          fill={color}
        />
      ))}
    </svg>
  );
}

// ── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const R = size / 2 - 5;
  const C = 2 * Math.PI * R;
  const filled = (score / 100) * C;
  const color =
    score >= 90 ? "#10b981" : score >= 75 ? "#6366f1" : "#f59e0b";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${filled} ${C - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#1e293b"
      >
        {score}
      </text>
    </svg>
  );
}

// ── Metric stat cell ─────────────────────────────────────────────────────────
function Stat({
  label,
  value,
  good,
  suffix = "%",
}: {
  label: string;
  value: number;
  good: boolean;
  suffix?: string;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-sm font-bold ${good ? "text-emerald-600" : "text-amber-500"
          }`}
      >
        {value}
        {suffix}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{label}</p>
    </div>
  );
}

// ── Expanded detail panel ─────────────────────────────────────────────────────
function MemberDetail({
  member,
  projectCount,
  completedCount,
}: {
  member: TeamMember;
  projectCount: number;
  completedCount: number;
}) {
  const metrics = member.metrics;
  const trend = metrics.monthlyTrend;

  if (!Array.isArray(trend) || trend.length < 2) {
    return (
      <tr>
        <td colSpan={9} className="px-6 pb-5 pt-0">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-xs text-slate-400">
            No monthly trend data available for this member.
          </div>
        </td>
      </tr>
    );
  }

  const W = 280;
  const H = 80;
  const padL = 24;
  const padB = 20;
  const padT = 8;
  const chartW = W - padL - 8;
  const chartH = H - padB - padT;

  const maxSub = Math.max(...trend.map((d) => d.submitted), 1);
  const xStep = chartW / (trend.length - 1);

  function yPos(v: number) {
    return padT + chartH - (v / maxSub) * chartH;
  }

  const subPts = trend
    .map((d, i) => `${padL + i * xStep},${yPos(d.submitted)}`)
    .join(" ");
  const appPts = trend
    .map((d, i) => `${padL + i * xStep},${yPos(d.approved)}`)
    .join(" ");

  return (
    <tr>
      <td colSpan={9} className="px-6 pb-5 pt-0">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: stat bars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Performance Breakdown
            </p>
            {[
              {
                label: "Approval Rate",
                val: member.approvalRate,
                color: "bg-emerald-500",
              },
              {
                label: "On-Time Delivery",
                val: metrics.onTimeDelivery,
                color: "bg-indigo-500",
              },
              {
                label: "SLA Compliance",
                val: member.slaCompliance,
                color: "bg-blue-500",
              },
              {
                label: "Rejection Rate",
                val: metrics.rejectionRate,
                color: "bg-red-400",
              },
            ].map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{b.label}</span>
                  <span className="font-semibold text-slate-700">
                    {b.val}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${b.color}`}
                    style={{ width: `${b.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Middle: submission trend chart */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Monthly Submission Trend
            </p>
            <svg
              width={W}
              height={H}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
            >
              {[0, 0.5, 1].map((t, i) => {
                const y = padT + chartH - t * chartH;
                return (
                  <g key={i}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={W - 8}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 3}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="8"
                      fill="#94a3b8"
                    >
                      {Math.round(t * maxSub)}
                    </text>
                  </g>
                );
              })}

              {/* area fills */}
              <path
                d={`M ${padL},${padT + chartH} L ${subPts
                  .split(" ")
                  .join(" L ")} L ${padL + (trend.length - 1) * xStep},${padT + chartH
                  } Z`}
                fill="#3b82f6"
                opacity={0.08}
              />

              <polyline
                points={subPts}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={appPts}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 2"
              />

              {trend.map((d, i) => (
                <text
                  key={i}
                  x={padL + i * xStep}
                  y={H - 2}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94a3b8"
                >
                  {d.month}
                </text>
              ))}
            </svg>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="h-1.5 w-4 rounded-full bg-blue-400" />
                Submitted
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="h-1.5 w-4 rounded-full bg-emerald-400" />
                Approved
              </div>
            </div>
          </div>

          {/* Right: skills + project summary */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Key Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {metrics.skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Project Summary
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: FolderKanban, label: "Active Tasks", val: metrics.taskActive, color: "text-blue-600 bg-blue-50" },
                  { icon: CheckCircle, label: "Completed Tasks", val: metrics.taskCompleted, color: "text-emerald-600 bg-emerald-50" },
                  { icon: AlertCircle, label: "Rejected Tasks", val: metrics.taskRejected, color: "text-amber-600 bg-amber-50" },
                ].map(({ icon: Icon, label, val, color }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 ${color.split(" ")[1]}`}
                  >
                    <Icon size={13} className={color.split(" ")[0]} />
                    <div>
                      <p className={`text-sm font-bold ${color.split(" ")[0]}`}>{val}</p>
                      <p className="text-[10px] text-slate-400">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyTeamPage() {
  const { user } = useAuth();
  const mId = user?.id ?? "";

  const [myTeam, setMyTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real team members from the backend
  useEffect(() => {
    let isMounted = true;

    async function fetchTeam() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

        // Fetch team members and trend data in parallel
        const [membersRes, trendsRes] = await Promise.all([
          fetch(`http://localhost:8080/api/manager/team`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.manager.getTeamTrends<Record<string, { month: string; submitted: number; approved: number }[]>>()
            .catch(() => ({})),
        ]);

        if (!membersRes.ok) throw new Error("Failed to fetch team data");
        const json = await membersRes.json();
        const trendMap: Record<string, { month: string; submitted: number; approved: number }[]> =
          (trendsRes as any) ?? {};

        // Fetch real per-member stats separately so failures don't crash the page
        let statsMap: Record<string, any> = {};
        try {
          const statsRes = await api.manager.getTeamStats<Record<string, any>>();
          statsMap = (statsRes as any) ?? {};
        } catch {
          console.warn("Could not fetch team stats, using fallback values");
        }

        // Map backend UserDTO to frontend TeamMember, using real stats from statsMap
        // Filter out the manager themselves — only show EMPLOYEE-role members
        const mappedTeam: TeamMember[] = (json.data || [])
          .filter((u: any) => u.role === "EMPLOYEE")
          .map((u: any) => {
            const realStats = statsMap[String(u.id)];
            // Use only backend values; no synthetic fallbacks.
            const completedProjectsVal = Number(realStats?.taskCompleted ?? realStats?.completed) || 0;
            const activeProjectsVal = Number(realStats?.taskActive ?? realStats?.active) || 0;
            const approvalRateVal = Number(realStats?.approvalRate) || 0;
            const slaComplianceVal = Number(realStats?.slaCompliance) || 0;
            const performanceScoreVal = Number(realStats?.performanceScore) || 0;
            const realTrend = trendMap[String(u.id)];
            const monthlyTrend = Array.isArray(realTrend) ? realTrend : [];
            return {
              id: `U${u.id.toString().padStart(3, "0")}`,
              name: u.name,
              role: u.role,
              email: u.email,
              department: u.department,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
              managerId: mId,
              status: "Active",
              slaCompliance: slaComplianceVal,
              activeProjects: activeProjectsVal,
              completedProjects: completedProjectsVal,
              performanceScore: performanceScoreVal,
              approvalRate: approvalRateVal,
              metrics: {
                avgSubmissionTime: Number(realStats?.avgSubmissionTime) || 0,
                rejectionRate: Number(realStats?.rejectionRate) || 0,
                taskActive: Number(realStats?.taskActive) || 0,
                taskCompleted: Number(realStats?.taskCompleted) || 0,
                taskRejected: Number(realStats?.taskRejected) || 0,
                onTimeDelivery: slaComplianceVal,
                streak: Number(realStats?.streak) || 0,
                skillTags: (u.skills && u.skills.length > 0) ? u.skills : [],
                monthlyTrend,
              }
            };
          });

        if (isMounted) {
          setMyTeam(mappedTeam);
        }
      } catch (err) {
        console.error("Error fetching team:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTeam();

    const handleFocus = () => {
      fetchTeam();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchTeam();
      }
    };

    const intervalId = window.setInterval(fetchTeam, 20000);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mId]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState<string>("performanceScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let list = myTeam.filter((m) => {
      const s = search.toLowerCase();
      const matchSearch =
        s === "" ||
        m.name.toLowerCase().includes(s) ||
        m.role.toLowerCase().includes(s);
      const matchStatus = filterStatus === "All" || m.status === filterStatus;
      return matchSearch && matchStatus;
    });

    list = [...list].sort((a, b) => {
      const map: Record<string, number> = {
        performanceScore: a.performanceScore - b.performanceScore,
        slaCompliance: a.slaCompliance - b.slaCompliance,
        approvalRate: a.approvalRate - b.approvalRate,
        activeProjects: a.activeProjects - b.activeProjects,
        completedProjects: a.completedProjects - b.completedProjects,
      };
      const diff = map[sortField] ?? 0;
      return sortDir === "desc" ? -diff : diff;
    });

    return list;
  }, [myTeam, search, filterStatus, sortField, sortDir]);

  // Team-level aggregates
  const avgScore = myTeam.length
    ? Math.round(
      myTeam.reduce((s, m) => s + m.performanceScore, 0) /
      myTeam.length
    )
    : 0;
  const avgSLA = myTeam.length
    ? Math.round(myTeam.reduce((s, m) => s + m.slaCompliance, 0) / myTeam.length)
    : 0;
  const totalActive = myTeam.reduce((s, m) => s + m.activeProjects, 0);
  const topPerformer = [...myTeam].sort(
    (a, b) => b.performanceScore - a.performanceScore
  )[0];

  function SortBtn({ field }: { field: string }) {
    return sortField === field ? (
      sortDir === "desc" ? (
        <ChevronDown size={12} className="ml-1 text-emerald-500" />
      ) : (
        <ChevronUp size={12} className="ml-1 text-emerald-500" />
      )
    ) : (
      <ChevronDown size={12} className="ml-1 text-slate-300" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Team</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {myTeam.length} members · Performance analysis scoped to your direct reports
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: Award,
            title: "Avg Performance",
            value: `${avgScore}/100`,
            sub: "Across all team members",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            bar: avgScore,
            barColor: "bg-indigo-500",
          },
          {
            icon: ShieldCheck,
            title: "Avg SLA Compliance",
            value: `${avgSLA}%`,
            sub: "Team-wide SLA rate",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            bar: avgSLA,
            barColor: "bg-emerald-500",
          },
          {
            icon: FolderKanban,
            title: "Active Tasks",
            value: String(totalActive),
            sub: "Across all members",
            color: "text-blue-600",
            bg: "bg-blue-50",
            bar: Math.min(100, totalActive * 10),
            barColor: "bg-blue-500",
          },
          {
            icon: Star,
            title: "Top Performer",
            value: topPerformer?.name.split(" ")[0] ?? "—",
            sub: `Score: ${topPerformer?.performanceScore ?? "—"}`,
            color: "text-amber-600",
            bg: "bg-amber-50",
            bar: topPerformer?.performanceScore ?? 0,
            barColor: "bg-amber-400",
          },
        ].map(({ icon: Icon, title, value, sub, color, bg, bar, barColor }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-3`}
            >
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
            <div className="mt-2 h-1 w-full rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${bar}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
        >
          <option value="All">All Status</option>
          <option>Active</option>
          <option>Busy</option>
          <option>On Leave</option>
        </select>
      </div>

      {/* Team table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Member
                </th>
                {[
                  { label: "Score", field: "performanceScore" },
                  { label: "SLA %", field: "slaCompliance" },
                  { label: "Approval %", field: "approvalRate" },
                  { label: "Active Tasks", field: "activeProjects" },
                  { label: "Completed Tasks", field: "completedProjects" },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                  >
                    <span className="flex items-center">
                      {label}
                      <SortBtn field={field} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  Trend
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-slate-400"
                  >
                    No team members found
                  </td>
                </tr>
              )}
              {filtered.flatMap((m) => {
                const metrics = m.metrics;
                const isExpanded = expandedId === m.id;
                const projCount = m.activeProjects + m.completedProjects;
                const completedCount = m.completedProjects;
                const score = m.performanceScore;
                const scoreColor =
                  score >= 90
                    ? "text-emerald-600"
                    : score >= 75
                      ? "text-indigo-600"
                      : "text-amber-500";

                const mainRow = (
                  <tr
                    key={`row-${m.id}`}
                    className={`cursor-pointer transition-colors border-b border-slate-50 ${isExpanded ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                      }`}
                    onClick={() => toggleExpand(m.id)}
                  >
                    {/* Member */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="h-9 w-9 rounded-full object-cover border-2 border-slate-100"
                          />
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${m.status === "Active"
                              ? "bg-emerald-500"
                              : m.status === "Busy"
                                ? "bg-amber-400"
                                : "bg-slate-300"
                              }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {m.role}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <ScoreRing score={score} size={36} />
                        <span className={`text-xs font-bold ${scoreColor}`}>
                          {score >= 90 ? "Excellent" : score >= 75 ? "Good" : "Average"}
                        </span>
                      </div>
                    </td>

                    {/* SLA */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-xs font-bold ${m.slaCompliance >= 95
                            ? "text-emerald-600"
                            : m.slaCompliance >= 85
                              ? "text-indigo-600"
                              : "text-amber-500"
                            }`}
                        >
                          {m.slaCompliance}%
                        </span>
                        <div className="h-1 w-16 rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${m.slaCompliance >= 95
                              ? "bg-emerald-500"
                              : m.slaCompliance >= 85
                                ? "bg-indigo-400"
                                : "bg-amber-400"
                              }`}
                            style={{ width: `${m.slaCompliance}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Approval rate */}
                    <td className="px-4 py-3.5">
                      <Stat
                        label=""
                        value={m.approvalRate ?? 0}
                        good={(m.approvalRate ?? 0) >= 85}
                      />
                    </td>

                    {/* Active */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {m.activeProjects}
                      </span>
                    </td>

                    {/* Completed */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                      {m.completedProjects}
                    </td>

                    {/* Sparkline */}
                    <td className="px-4 py-3.5">
                      {metrics && (
                        <Sparkline
                          data={metrics.monthlyTrend}
                          color={score >= 90 ? "#10b981" : score >= 75 ? "#6366f1" : "#f59e0b"}
                        />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : m.status === "Busy"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Expand toggle */}
                    <td className="px-4 py-3.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${isExpanded
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                          }`}
                      >
                        {isExpanded ? (
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )}
                      </div>
                    </td>
                  </tr>
                );

                if (isExpanded && metrics) {
                  return [
                    mainRow,
                    <MemberDetail
                      key={`detail-${m.id}`}
                      member={m}
                      projectCount={projCount}
                      completedCount={completedCount}
                    />,
                  ];
                }
                return [mainRow];
              })}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length} of {myTeam.length} team members shown · Click any row to expand performance details
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" /> Excellent (90+)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-indigo-500" /> Good (75–89)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-400" /> Average (&lt;75)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
