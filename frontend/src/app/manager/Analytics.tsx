import { useState, useEffect } from "react";
import { Award, TrendingUp, Target, Zap, Calendar, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthlyTrendItem {
  month: string;
  submissions: number;
  approved: number;
}

interface AnalyticsData {
  monthlyTrend: MonthlyTrendItem[];
  avgApprovalHours: number;
  approvalRate: number;
  slaBreachRate: number;
  rejectionRate: number;
  efficiencyScore: number;
  teamPerformanceIndex: number;
  totalSubmissions: number;
  totalApproved: number;
}

// ── Date filter presets ───────────────────────────────────────────────────────

type FilterKey = "7d" | "30d" | "6m" | "1y";

interface FilterOption {
  key: FilterKey;
  label: string;
  days: number;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "6m", label: "Last 6 Months", days: 182 },
  { key: "1y", label: "Last 1 Year", days: 365 },
];

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * C;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={R} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle
            cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${filled} ${C - filled}`}
            strokeLinecap="round" transform="rotate(-90 65 65)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{score}</span>
          <span className="text-[10px] text-slate-400 font-medium">/100</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-700 text-center">{label}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon, title, value, desc, color, bg,
}: {
  icon: any; title: string; value: string; desc: string; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

function ProgressBar({ label, val, bar, color }: { label: string; val: string; bar: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{val}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, bar))}%` }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
      <Calendar size={32} className="text-slate-300" />
      <p className="text-sm font-medium">No data available for selected date range</p>
      <p className="text-xs">Try selecting a wider date range</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [filter, setFilter] = useState<FilterKey>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const preset = FILTER_OPTIONS.find((f) => f.key === filter)!;
    const { startDate, endDate } = getDateRange(preset.days);

    setLoading(true);
    setError(null);

    api.manager
      .getAnalytics({ startDate, endDate })
      .then((res: any) => {
        setData(res as AnalyticsData);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to load analytics data.");
      })
      .finally(() => setLoading(false));
  }, [filter, user]);

  // ── Derived chart datasets ────────────────────────────────────────────────

  const submissionBar = (data?.monthlyTrend ?? []).map((d) => ({
    label: d.month,
    value: d.submissions,
    value2: d.approved,
  }));

  // isEmpty for score/metric cards (show EmptyState when no submissions at all)
  const isEmpty = !loading && !error && (!data || data.totalSubmissions === 0);
  // chartEmpty for trend charts — only empty when the trend array has no rows
  const chartEmpty = !loading && !error && submissionBar.length === 0;

  const avgApprovalHrs = data?.avgApprovalHours ?? 0;
  const approvalRate = data?.approvalRate ?? 0;
  const slaBreachRate = data?.slaBreachRate ?? 0;
  const rejectionRate = data?.rejectionRate ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Performance metrics scoped to your team and approvals
          </p>
        </div>

        {/* Date filter dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className="text-sm text-slate-700 font-medium bg-transparent border-none outline-none cursor-pointer pr-1"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {loading && <RefreshCw size={12} className="text-indigo-400 animate-spin ml-1" />}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Manager Efficiency Score */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Award size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-800">Manager Efficiency Score</h2>
          </div>
          {loading ? (
            <div className="flex items-center gap-8 animate-pulse">
              <div className="w-32 h-32 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-slate-100 rounded-full" />)}
              </div>
            </div>
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            <div className="flex items-center gap-8">
              <ScoreRing
                score={data?.efficiencyScore ?? 0}
                label="Efficiency Score"
                color="#6366f1"
              />
              <div className="flex-1 space-y-3">
                <ProgressBar label="Avg Review Time" val={`${avgApprovalHrs}h`} bar={Math.min(100, 100 - avgApprovalHrs * 2)} color="bg-indigo-500" />
                <ProgressBar label="Approval Rate" val={`${approvalRate}%`} bar={approvalRate} color="bg-emerald-500" />
                <ProgressBar label="SLA Breach Rate" val={`${slaBreachRate}%`} bar={100 - slaBreachRate} color="bg-amber-400" />
              </div>
            </div>
          )}
        </div>

        {/* Team Performance Index */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-800">Team Performance Index</h2>
          </div>
          {loading ? (
            <div className="flex items-center gap-8 animate-pulse">
              <div className="w-32 h-32 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-slate-100 rounded-full" />)}
              </div>
            </div>
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            <div className="flex items-center gap-8">
              <ScoreRing
                score={data?.teamPerformanceIndex ?? 0}
                label="Performance Index"
                color="#10b981"
              />
              <div className="flex-1 space-y-3">
                <ProgressBar label="Projects Submitted" val={String(data?.totalSubmissions ?? 0)} bar={Math.min(100, (data?.totalSubmissions ?? 0) * 5)} color="bg-blue-500" />
                <ProgressBar label="Projects Approved" val={String(data?.totalApproved ?? 0)} bar={Math.min(100, (data?.totalApproved ?? 0) * 6)} color="bg-emerald-500" />
                <ProgressBar label="Avg Rejection Rate" val={`${rejectionRate}%`} bar={100 - rejectionRate} color="bg-red-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse h-32" />
          ))
        ) : (
          <>
            <MetricCard icon={Zap} title="Avg Approval Time" value={`${avgApprovalHrs}h`} desc="Per approval action" color="text-indigo-600" bg="bg-indigo-50" />
            <MetricCard icon={Target} title="Approval Rate" value={`${approvalRate}%`} desc="Submissions approved" color="text-emerald-600" bg="bg-emerald-50" />
            <MetricCard icon={Award} title="SLA Breach Rate" value={`${slaBreachRate}%`} desc="Pending past deadline" color="text-amber-600" bg="bg-amber-50" />
            <MetricCard icon={TrendingUp} title="Rejection Rate" value={`${rejectionRate}%`} desc="Team rejection average" color="text-red-500" bg="bg-red-50" />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Team Submission Trend */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Monthly Project Trends</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submissions vs approved — filtered by selected date range</p>
          </div>
          {loading ? (
            <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
          ) : chartEmpty ? (
            <EmptyState />
          ) : (
            <BarChart
              data={submissionBar}
              color="#3b82f6"
              color2="#10b981"
              label="Submitted"
              label2="Approved"
              height={180}
            />
          )}
        </div>

        {/* Approval Rate Over Time */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Approval Rate Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEmpty
                ? "No data for selected range"
                : `${data?.totalApproved ?? 0} of ${data?.totalSubmissions ?? 0} projects approved`}
            </p>
          </div>
          {loading ? (
            <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            <BarChart
              data={[
                { label: "Approved", value: data?.totalApproved ?? 0, color: "#10b981" },
                { label: "Rejected", value: Math.round((data?.totalSubmissions ?? 0) * (rejectionRate / 100)), color: "#ef4444" },
                { label: "Pending", value: Math.max(0, (data?.totalSubmissions ?? 0) - (data?.totalApproved ?? 0) - Math.round((data?.totalSubmissions ?? 0) * (rejectionRate / 100))), color: "#f59e0b" },
              ]}
              color="#10b981"
              label="Count"
              height={160}
            />
          )}

        </div>

        {/* Avg Approval Time */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Avg Approval Time</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEmpty ? "No data for selected range" : `${avgApprovalHrs}h average in this period`}
            </p>
          </div>
          {loading ? (
            <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
          ) : chartEmpty ? (
            <EmptyState />
          ) : (
            <LineChart
              data={submissionBar.map((d) => ({ label: d.label, value: d.value }))}
              color="#6366f1"
              label="Submissions"
              unit=""
              height={160}
            />
          )}
        </div>
      </div>
    </div>
  );
}
