import { Calendar, RefreshCw, PieChart, TrendingUp, Users, AlertCircle } from "lucide-react";
import { DonutChart } from "./DonutChart";
import { LineChart } from "./LineChart";

// ── Helpers & Types ──────────────────────────────────────────────────────────

interface HorizBarChartProps {
  data: Array<{ stage: string; time: number }>;
}

function HorizBarChart({ data }: HorizBarChartProps) {
  if (!data?.length) return <div className="flex h-32 items-center justify-center text-xs text-slate-400">No data for period</div>;
  const maxVal = Math.max(...data.map((d) => d.time), 1);
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={d.stage + i} className="group">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5 transition-colors group-hover:text-slate-800">
            <span>{d.stage}</span>
            <span className="text-slate-800">{d.time}h</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out`}
              style={{
                width: `${(d.time / maxVal) * 100}%`,
                background: i === 0
                  ? "linear-gradient(90deg, #6366f1, #818cf8)"
                  : i === 1
                    ? "linear-gradient(90deg, #818cf8, #a5b4fc)"
                    : "linear-gradient(90deg, #a5b4fc, #c7d2fe)"
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface VertBarChartProps {
  data: Array<{ department: string; delay: number }>;
}

function VertBarChart({ data }: VertBarChartProps) {
  if (!data?.length) return <div className="flex h-48 items-center justify-center text-xs text-slate-400">No data for period</div>;
  const W = 600, H = 200;
  const maxVal = Math.max(...data.map((d) => d.delay), 1);
  const padL = 20, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = 40;
  const step = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="barGradRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.5, 1].map((v) => {
        const y = padT + chartH * (1 - v);
        return (
          <line key={v} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f8fafc" strokeWidth="1" strokeDasharray="4 4" />
        );
      })}
      {data.map((d, i) => {
        const bh = (d.delay / maxVal) * chartH;
        const x = padL + i * step + step / 2 - barW / 2;
        const y = padT + chartH - bh;
        const color = d.delay > 25 ? "url(#barGradRed)" : d.delay > 12 ? "url(#barGradAmber)" : "url(#barGradGreen)";
        const labelColor = d.delay > 25 ? "#ef4444" : d.delay > 12 ? "#f59e0b" : "#10b981";
        return (
          <g key={d.department + i} className="group/bar">
            <rect x={x} y={y} width={barW} height={bh} rx={6} fill={color} className="transition-all duration-500 hover:opacity-100 opacity-90" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={labelColor}>{d.delay}h</text>
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={10} fontWeight={500} fill="#94a3b8">{d.department}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

interface DashboardChartsProps {
  overviewData: any;
  analyticsData: any;
  loading: boolean;
}

export function DashboardCharts({ overviewData, analyticsData, loading }: DashboardChartsProps) {
  const projectStatusDataMapped = overviewData ? [
    { name: "Completed", value: overviewData.statusDistribution?.["Completed"] ?? 0, color: "#10b981" },
    { name: "In Progress", value: overviewData.statusDistribution?.["In Progress"] ?? 0, color: "#6366f1" },
  ] : [];

  const trendData = (analyticsData?.monthlyTrends || []).map((t: any) => ({
    label: t.name,
    value: t.projects,
    value2: t.approvals,
  }));

  // Deduplicate bottlenecks by manager name (taking the max/latest if duplicates exist)
  const bottlenecksRaw: any[] = analyticsData?.bottlenecks ?? [];
  const uniqueBottlenecksMap = new Map();
  bottlenecksRaw.forEach((b: any) => {
    if (!uniqueBottlenecksMap.has(b.stage) || b.time > uniqueBottlenecksMap.get(b.stage).time) {
      uniqueBottlenecksMap.set(b.stage, b);
    }
  });
  const bottlenecks = Array.from(uniqueBottlenecksMap.values());

  const deptDelays: any[] = analyticsData?.departmentDelays ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {/* Donut — Project Status (always global, not date-filtered) */}
        <div className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500">
              <PieChart size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Project Status</h3>
          </div>
          <p className="mb-3 text-xs text-slate-400">Distribution by stage</p>
          <DonutChart segments={projectStatusDataMapped} />
        </div>

        {/* Line — Monthly Trends (date-filtered) */}
        <div className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2 transition-all hover:shadow-md">
          {loading && (
            <div className="absolute top-4 right-6">
              <RefreshCw size={14} className="text-indigo-400 animate-spin" />
            </div>
          )}
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Monthly Project Trends</h3>
          </div>
          <p className="mb-3 text-xs text-slate-400">Projects submitted vs. approved for selected period</p>
          <LineChart data={trendData} />
          <div className="mt-3 flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-2.5 w-5 rounded-full bg-indigo-500" />
              Projects
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
              Approvals
            </div>
          </div>
        </div>

        {/* Bottlenecks (date-filtered) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
              <Users size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Approval Bottlenecks</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">Avg hours per reviewer</p>
          <HorizBarChart data={bottlenecks} />
        </div>

        {/* Department Delays (date-filtered) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 xl:col-span-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500">
              <AlertCircle size={16} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Department Approval Delays</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">Average delay in hours by department</p>
          <VertBarChart data={deptDelays} />
          <div className="mt-3 flex items-center gap-5">
            {[
              { color: "#10b981", label: "≤ 12h — On Track" },
              { color: "#f59e0b", label: "13–25h — Delayed" },
              { color: "#ef4444", label: "> 25h — Critical" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
