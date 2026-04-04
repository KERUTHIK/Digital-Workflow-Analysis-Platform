import { useState, useEffect, useMemo } from "react";
import {
  ChevronUp, ChevronDown, Users, Clock, Activity, TrendingUp, Calendar, RefreshCw
} from "lucide-react";
import { api } from "../services/api";

// ── Date filter ───────────────────────────────────────────────────────────────

type FilterKey = "7d" | "30d" | "6m" | "1y";
const FILTER_OPTIONS: { key: FilterKey; label: string; days: number }[] = [
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "6m", label: "Last 6 Months", days: 182 },
  { key: "1y", label: "Last 1 Year", days: 365 },
];
function toISO(d: Date) { return d.toISOString().split("T")[0]; }
function getRange(days: number) {
  const end = new Date(); const start = new Date();
  start.setDate(end.getDate() - days);
  return { startDate: toISO(start), endDate: toISO(end) };
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({ title, value, subtitle, icon: Icon, color, trend, trendPositive }: {
  title: string; value: string; subtitle: string;
  icon: any; color: string; trend?: string; trendPositive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendPositive ? "text-emerald-600" : "text-red-500"}`}>
            {trendPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

// ── Rank / Status badges ──────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">🥇 #1</span>;
  if (rank === 2) return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">🥈 #2</span>;
  if (rank === 3) return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">🥉 #3</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">#{rank}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Average: "bg-amber-50 text-amber-700 border-amber-200",
    Poor: "bg-red-50 text-red-700 border-red-200",
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg[status] ?? cfg.Average}`}>{status}</span>;
}

function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 90 ? "#10b981" : value >= 80 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 min-w-[80px]">
        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8">{value}%</span>
    </div>
  );
}

// ── Manager Bar Chart ─────────────────────────────────────────────────────────

function ManagerBarChart({ data }: { data: any[] }) {
  if (data.length === 0) return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No approval data found for this period</div>;
  const maxVal = Math.max(...data.map((d) => d.avgTimeHours), 1);
  const W = 600, H = 32 * data.length + 40;
  const padL = 130, padR = 80, padT = 16, padB = 20;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const rowH = chartH / Math.max(1, data.length);
  const barH = Math.min(28, rowH - 10);
  const maxScale = Math.ceil(maxVal / 8) * 8;
  const xTicks = [0, 8, 16, 24, 32, 40].filter((t) => t <= maxScale + 8).slice(0, 6);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {xTicks.map((t) => {
        const x = padL + (t / maxScale) * chartW;
        return (
          <g key={t}>
            <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#f1f5f9" strokeWidth={1} />
            <text x={x} y={padT + chartH + 14} textAnchor="middle" fontSize={10} fill="#94a3b8">{t}h</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bw = (d.avgTimeHours / maxScale) * chartW;
        const y = padT + i * rowH + (rowH - barH) / 2;
        const color = d.avgTimeHours <= 8 ? "#10b981" : d.avgTimeHours <= 16 ? "#6366f1" : d.avgTimeHours <= 24 ? "#f59e0b" : "#ef4444";
        return (
          <g key={d.id}>
            <text x={padL - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize={11} fontWeight={600} fill="#475569">{String(d.name).split(" ")[0]}</text>
            <rect x={padL} y={y} width={Math.max(bw, 2)} height={barH} rx={5} fill={color} fillOpacity={0.85} />
            <text x={padL + Math.max(bw, 2) + 6} y={y + barH / 2 + 4} fontSize={11} fontWeight={700} fill={color}>{d.avgTime}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function ManagerPerformancePage() {
  const [filter, setFilter] = useState<FilterKey>("30d");
  const [managers, setManagers] = useState<any[]>([]);
  const [overallAvgHrs, setAvgHrs] = useState(0);
  const [overallSla, setSla] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("efficiency");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [filter]);

  async function fetchData() {
    setLoading(true);
    try {
      const preset = FILTER_OPTIONS.find((f) => f.key === filter)!;
      const { startDate, endDate } = getRange(preset.days);
      const res = await api.statistics.getAdminAnalytics({ startDate, endDate });
      setManagers(res.managers ?? []);
      setAvgHrs(res.overallAvgHours ?? 0);
      setSla(res.overallSla ?? 0);
    } catch (err) {
      console.error("Failed to load manager performance:", err);
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => {
    return [...managers].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      const an = typeof av === "string" ? parseFloat(av) : av ?? 0;
      const bn = typeof bv === "string" ? parseFloat(bv) : bv ?? 0;
      return sortDir === "asc" ? an - bn : bn - an;
    });
  }, [managers, sortField, sortDir]);

  const rankedData = useMemo(() => {
    const byEff = [...managers].sort((a, b) => b.efficiency - a.efficiency);
    return sorted.map((m) => ({ ...m, rank: byEff.findIndex((r) => r.id === m.id) + 1 }));
  }, [sorted, managers]);

  const totalPages = Math.ceil(rankedData.length / PAGE_SIZE);
  const paged = rankedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ChevronDown size={13} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={13} className="text-indigo-500" /> : <ChevronDown size={13} className="text-indigo-500" />;
  }

  const bestManager = managers.length > 0
    ? [...managers].sort((a, b) => b.efficiency - a.efficiency)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manager Performance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review approval efficiency, SLA compliance, and reviewer rankings</p>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as FilterKey); setPage(1); }}
            className="text-sm text-slate-700 font-medium bg-transparent border-none outline-none cursor-pointer pr-1"
          >
            {FILTER_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          {loading && <RefreshCw size={12} className="text-indigo-400 animate-spin ml-1" />}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total Managers" value={String(managers.length)}
          subtitle="Active reviewers" icon={Users} color="bg-blue-50 text-blue-600"
          />
        <KPICard title="Avg Approval Time" value={`${overallAvgHrs}h`}
          subtitle="Across all managers" icon={Clock} color="bg-indigo-50 text-indigo-600"
          />
        <KPICard title="Best Performer"
          value={loading ? "—" : bestManager ? bestManager.name.split(" ")[0] : "N/A"}
          subtitle={bestManager ? `${bestManager.efficiency}% efficiency score` : "No data"}
          icon={Activity} color="bg-amber-50 text-amber-600" />
        <KPICard title="SLA Compliance" value={`${overallSla}%`}
          subtitle="Avg across all managers" icon={TrendingUp} color="bg-emerald-50 text-emerald-600"
          />
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Manager vs Avg Approval Time</h3>
          <p className="text-xs text-slate-400 mt-0.5">Average hours to approve or reject a project — {FILTER_OPTIONS.find(f => f.key === filter)?.label}</p>
        </div>
        {loading ? (
          <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
        ) : (
          <ManagerBarChart data={managers} />
        )}
        <div className="mt-3 flex items-center gap-5">
          {[
            { color: "#10b981", label: "≤ 8h — Fast" },
            { color: "#6366f1", label: "9–16h — Normal" },
            { color: "#f59e0b", label: "17–24h — Slow" },
            { color: "#ef4444", label: "> 24h — Critical" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Performance Leaderboard</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by efficiency score · Click column headers to sort</p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rankedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Activity size={36} className="mb-3 text-slate-200" />
            <p className="text-sm font-medium">No manager approval data for this period</p>
            <p className="text-xs mt-1">Try selecting a wider date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                  {[
                    { label: "Manager", field: "name" },
                    { label: "Projects Reviewed", field: "reviewed" },
                    { label: "Avg Approval Time", field: "avgTimeHours" },
                    { label: "SLA %", field: "sla" },
                    { label: "Efficiency Score", field: "efficiency" },
                    { label: "Status", field: "status" },
                  ].map(({ label, field }) => (
                    <th key={label} onClick={() => toggleSort(field)}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none">
                      <div className="flex items-center gap-1">{label}<SortIcon field={field} /></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((manager: any) => (
                  <tr key={manager.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-4"><RankBadge rank={manager.rank} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={manager.avatar} alt={manager.name}
                          className="h-9 w-9 rounded-full object-cover border-2 border-slate-100"
                          onError={(e) => { (e.target as any).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=6366f1&color=fff`; }} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{manager.name}</p>
                          <p className="text-xs text-slate-400">{manager.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-800">{manager.reviewed}</span>
                        <span className="text-xs text-slate-400">projects</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-semibold ${manager.avgTimeHours <= 8 ? "text-emerald-600" :
                          manager.avgTimeHours <= 16 ? "text-indigo-600" :
                            manager.avgTimeHours <= 24 ? "text-amber-600" : "text-red-600"}`}>
                        {manager.avgTime}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-semibold ${manager.sla >= 95 ? "text-emerald-600" : manager.sla >= 85 ? "text-amber-600" : "text-red-500"}`}>
                        {manager.sla}%
                      </span>
                    </td>
                    <td className="px-4 py-4 min-w-[160px]"><EfficiencyBar value={manager.efficiency} /></td>
                    <td className="px-4 py-4"><StatusBadge status={manager.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {rankedData.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rankedData.length)} of {rankedData.length} managers
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${p === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
