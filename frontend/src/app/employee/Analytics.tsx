import { useState, useEffect, useRef, type ComponentType } from "react";
import {
  TrendingUp, Award, Timer, AlertTriangle, BarChart2,
  CheckCircle, Target, Loader2, FolderOpen, ClipboardCheck,
  ChevronRight, Zap, Star, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { api } from "../services/api";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";
import { DonutChart } from "../components/DonutChart";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface TrendPoint { month: string; count: number }
interface Analytics {
  submissionTrend: TrendPoint[];
  projectTrend: TrendPoint[];
  avgProcessingDays: number;
  totalSubmitted: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  totalDraft: number;
  approvalRate: number;
  rejectionRate: number;
  taskTotal: number;
  taskCompleted: number;
  taskPending: number;
  taskRejected: number;
  taskUnderReview: number;
  taskApprovalRate: number;
  performanceScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gradient KPI Card
// ─────────────────────────────────────────────────────────────────────────────
function GradientKpiCard({
  icon: Icon,
  title,
  value,
  sub,
  gradient,
  iconBg,
  trend,
}: {
  icon: ComponentType<any>;
  title: string;
  value: string;
  sub: string;
  gradient: string;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 shadow-sm"
      style={{ background: gradient }}
    >
      {/* Decorative blob */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
        style={{ background: "rgba(255,255,255,0.6)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full opacity-10"
        style={{ background: "rgba(255,255,255,0.8)" }}
      />

      <div className="relative flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
          style={{ background: iconBg }}
        >
          <Icon size={18} className="text-white" />
        </div>
        {trend === "up" && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-white/80 bg-white/20 rounded-full px-2 py-0.5">
            <ArrowUpRight size={10} /> Better
          </span>
        )}
        {trend === "down" && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-white/80 bg-white/20 rounded-full px-2 py-0.5">
            <ArrowDownRight size={10} /> Watch
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        <p className="text-xs font-semibold text-white/80 mt-1">{title}</p>
        <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Score Ring
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedScoreRing({
  score,
  label,
  color,
  trackColor = "#f1f5f9",
  size = 130,
}: {
  score: number;
  label: string;
  color: string;
  trackColor?: string;
  size?: number;
}) {
  const [animated, setAnimated] = useState(0);
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 16;
  const C = 2 * Math.PI * R;
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setAnimated(Math.round(p * score));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);
  const filled = (animated / 100) * C;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={trackColor} strokeWidth="14" />
          <circle
            cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={`${filled} ${C - filled}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-800">{animated}</span>
          <span className="text-[10px] text-slate-400 font-medium">/100</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat progress bar row
// ─────────────────────────────────────────────────────────────────────────────
function StatBar({ label, val, bar, colorClass }: { label: string; val: string; bar: number; colorClass: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, bar))), 50);
    return () => clearTimeout(t);
  }, [bar]);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-700">{val}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section card wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ title, sub, icon: Icon, iconColor, children }: {
  title: string; sub?: string; icon: ComponentType<any>; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon size={15} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legend row for donuts
// ─────────────────────────────────────────────────────────────────────────────
function DonutLegend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((d) => (
        <div key={d.name} className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
          <span className="text-xs text-slate-500 flex-1">{d.name}</span>
          <span className="font-bold text-sm text-slate-700">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendTab, setTrendTab] = useState<"tasks" | "projects">("projects");

  useEffect(() => {
    api.employee
      .getAnalytics<Analytics>()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center gap-3 text-slate-400 text-sm">
        <Loader2 size={22} className="animate-spin text-violet-500" />
        Crunching your numbers…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-400 text-sm">
        {error ?? "No analytics data found."}
      </div>
    );
  }

  // Chart data
  const submissionBar = data.submissionTrend.map((d) => ({ label: d.month, value: d.count }));
  const projectLine = data.projectTrend.map((d) => ({ label: d.month, value: d.count }));

  const projectDonut = [
    { name: "Approved", value: Number(data.totalApproved), color: "#10b981" },
    { name: "Pending", value: Number(data.totalPending), color: "#f59e0b" },
    { name: "Rejected", value: Number(data.totalRejected), color: "#ef4444" },
    { name: "Draft", value: Number(data.totalDraft), color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const taskDonut = [
    { name: "Completed", value: Number(data.taskCompleted), color: "#10b981" },
    { name: "Pending", value: Number(data.taskPending), color: "#f59e0b" },
    { name: "Under Review", value: Number(data.taskUnderReview), color: "#6366f1" },
    { name: "Rejected", value: Number(data.taskRejected), color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const mostActiveProjMonth = [...data.projectTrend].sort((a, b) => b.count - a.count)[0]?.month ?? "–";
  const mostActiveTaskMonth = [...data.submissionTrend].sort((a, b) => b.count - a.count)[0]?.month ?? "–";

  const scoreGrade =
    data.performanceScore >= 80 ? "Excellent 🏆" :
      data.performanceScore >= 60 ? "Good 👍" :
        data.performanceScore >= 40 ? "Fair 📈" : "Needs Improvement";

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 shadow-lg"
        style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #7c3aed 100%)" }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-20 bottom-0 h-24 w-24 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-yellow-300" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Performance Report</span>
            </div>
            <h1 className="text-2xl font-black text-white">My Analytics</h1>
            <p className="text-sm text-white/60 mt-1">
              Performance insights based on your visible projects &amp; task submissions
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-3 border border-white/20">
            <div>
              <p className="text-3xl font-black text-white">{data.performanceScore}</p>
              <p className="text-[11px] text-white/60 font-medium">Performance Score</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-sm font-bold text-yellow-300">{scoreGrade}</p>
              <p className="text-[11px] text-white/60">{data.approvalRate}% approval rate</p>
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Projects", value: data.totalSubmitted, suffix: "" },
            { label: "Approved", value: data.totalApproved, suffix: "" },
            { label: "Tasks Assigned", value: data.taskTotal, suffix: "" },
            { label: "Tasks Completed", value: data.taskCompleted, suffix: "" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 border border-white/15 px-4 py-2">
              <p className="text-xl font-black text-white">{s.value}{s.suffix}</p>
              <p className="text-[11px] text-white/60 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard
          icon={Target}
          title="Approval Rate"
          value={`${data.approvalRate}%`}
          sub="Projects successfully approved"
          gradient="linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)"
          iconBg="rgba(255,255,255,0.30)"
          trend={data.approvalRate >= 60 ? "up" : "down"}
        />
        <GradientKpiCard
          icon={Timer}
          title="Avg Processing"
          value={`${data.avgProcessingDays}d`}
          sub="Average days from submit to decision"
          gradient="linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)"
          iconBg="rgba(255,255,255,0.30)"
          trend={data.avgProcessingDays <= 5 ? "up" : "down"}
        />
        <GradientKpiCard
          icon={AlertTriangle}
          title="Rejected Tasks"
          value={String(data.taskRejected)}
          sub={`Out of ${data.taskTotal} total assigned tasks`}
          gradient="linear-gradient(135deg, #f87171 0%, #fca5a5 100%)"
          iconBg="rgba(255,255,255,0.30)"
          trend={data.taskRejected === 0 ? "up" : "down"}
        />
        <GradientKpiCard
          icon={CheckCircle}
          title="Task Completion"
          value={`${data.taskApprovalRate}%`}
          sub={`${data.taskCompleted} of ${data.taskTotal} tasks done`}
          gradient="linear-gradient(135deg, #fbbf24 0%, #fde68a 100%)"
          iconBg="rgba(255,255,255,0.30)"
          trend={data.taskApprovalRate >= 60 ? "up" : "neutral"}
        />
      </div>

      {/* ── Score + Breakdowns ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Score ring */}
        <SectionCard title="Performance Score" sub="Composite of all metrics" icon={Award} iconColor="bg-violet-600">
          <div className="flex flex-col items-center gap-5">
            <AnimatedScoreRing score={data.performanceScore} label="Overall Score" color="#7c3aed" size={140} />
            <div className="w-full space-y-3">
              <StatBar label="Approval Rate" val={`${data.approvalRate}%`} bar={data.approvalRate} colorClass="bg-emerald-500" />
              <StatBar label="Task Completion" val={`${data.taskApprovalRate}%`} bar={data.taskApprovalRate} colorClass="bg-violet-500" />
              <StatBar label="Processing Speed" val={`${data.avgProcessingDays}d`} bar={Math.max(0, 100 - data.avgProcessingDays * 3)} colorClass="bg-blue-500" />
            </div>
          </div>
        </SectionCard>

        {/* Project donut */}
        <SectionCard title="Project Status" sub="All visible team projects at a glance" icon={FolderOpen} iconColor="bg-blue-500">
          {projectDonut.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={projectDonut}
                size={150}
                thickness={24}
                centerLabel={String(data.totalSubmitted)}
                centerSub="Projects"
              />
              <DonutLegend items={projectDonut} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No project data</p>
          )}
        </SectionCard>

        {/* Task donut */}
        <SectionCard title="Task Status" sub="Work assigned by your manager" icon={ClipboardCheck} iconColor="bg-indigo-500">
          {taskDonut.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={taskDonut}
                size={150}
                thickness={24}
                centerLabel={String(data.taskTotal)}
                centerSub="Tasks"
              />
              <DonutLegend items={taskDonut} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No tasks assigned yet</p>
          )}
        </SectionCard>
      </div>

      {/* ── Trend Charts (tabbed) ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Activity Trends</h2>
              <p className="text-[11px] text-slate-400">Last 6 months of activity</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(["projects", "tasks"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTrendTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${trendTab === t
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {t === "projects" ? "Projects" : "Tasks"}
              </button>
            ))}
          </div>
        </div>
        {trendTab === "projects" ? (
          <div>
            <p className="text-xs text-slate-400 mb-3">Visible team projects created per month</p>
            <LineChart data={projectLine} color="#6366f1" label="Projects" height={180} />
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mb-3">Tasks submitted per month</p>
            <BarChart data={submissionBar} color="#7c3aed" label="Tasks" height={180} />
          </div>
        )}
      </div>

    </div>
  );
}
