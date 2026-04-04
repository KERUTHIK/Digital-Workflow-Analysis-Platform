import { useState, useEffect } from "react";
import {
  FolderKanban,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  ArrowRight,
  Timer,
  ClipboardList,
  Target,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LineChart } from "../components/LineChart";

function KPICard({
  icon: Icon,
  title,
  value,
  sub,
  trend,
  trendUp,
  iconBg,
  iconColor,
}: {
  icon: any;
  title: string;
  value: string | number;
  sub: string;
  trend: string;
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
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

interface Project {
  id: string;
  rawId: number;
  title: string;
  slaStatus: "On Time" | "Breached" | "At Risk";
  progress: number;
  slaDeadline: string;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchMyProjects();
    fetchPendingTasks();
    fetchAnalytics();
  }, [user]);

  async function fetchAnalytics() {
    try {
      const data = await api.employee.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch employee analytics:", err);
    }
  }

  async function fetchPendingTasks() {
    try {
      const tasks = await api.employee.getMyTasks<any[]>();
      const pending = Array.isArray(tasks) ? tasks.filter((t: any) => t.status === "PENDING").length : 0;
      setPendingTasksCount(pending);
    } catch { /* silently ignore */ }
  }

  async function fetchMyProjects() {
    if (!user) return;
    try {
      setLoading(true);
      const [response, taskStats] = await Promise.all([
        api.employee.getMyProjects({ page: "0", size: "1000" }),
        api.employee.getProjectTaskStats<any>(),
      ]);
      const mapped = (response.content || []).map((p: any) => ({
        id: "PRJ-" + p.id.toString().padStart(3, "0"),
        rawId: p.id,
        title: p.title,
        slaStatus: "On Time",
        progress: (() => {
          const projectStats = taskStats?.[p.id] || taskStats?.[String(p.id)];
          const totalTasks = Number(projectStats?.total) || 0;
          const completedTasks = Number(projectStats?.completed) || 0;
          return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        })(),
        slaDeadline: p.updatedAt || p.createdAt,
      }));
      setProjects(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const total = projects.length;
  const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;
  const completedCount = projects.filter(p => p.progress === 100).length;

  const submissionLine = (analytics?.submissionTrend ?? []).map((d: any) => ({
    label: d.month,
    value: d.count,
  }));

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const taskTotal = analytics?.taskTotal ?? 0;
  const taskCompleted = analytics?.taskCompleted ?? 0;
  const taskPending = analytics?.taskPending ?? 0;
  const taskUnderReview = analytics?.taskUnderReview ?? 0;
  const taskRejected = analytics?.taskRejected ?? 0;
  const taskRate = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;
  const R = 36;
  const C = 2 * Math.PI * R;
  const filled = (taskRate / 100) * C;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {greeting}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{dateStr} · Employee Portal</p>
        </div>
      </div>

      {/* Pending Tasks Banner */}
      {pendingTasksCount > 0 && (
        <Link
          to="/employee/tasks"
          className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3.5 hover:bg-violet-100 transition-colors group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
            <ClipboardList size={18} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-800">
              You have <span className="text-violet-600">{pendingTasksCount}</span> pending task{pendingTasksCount > 1 ? "s" : ""} assigned by your manager
            </p>
            <p className="text-xs text-violet-500 mt-0.5">Click to view and submit your work</p>
          </div>
          <ArrowRight size={16} className="text-violet-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard
          icon={FolderKanban}
          title="Total Projects"
          value={total}
          sub="Visible to your team"
          trend={`${completedCount} completed`}
          trendUp={true}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={Target}
          title="Avg Progress"
          value={`${avgProgress}%`}
          sub="Across visible projects"
          trend={`${total} project${total === 1 ? "" : "s"}`}
          trendUp={avgProgress > 50}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <KPICard
          icon={CheckCircle}
          title="Completed"
          value={completedCount}
          sub="Fully finished"
          trend={`${total > 0 ? Math.round((completedCount / total) * 100) : 0}% of visible projects`}
          trendUp={true}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KPICard
          icon={BarChart3}
          title="Active Projects"
          value={total - completedCount}
          sub="In development"
          trend={`${Math.max(total - completedCount, 0)} active now`}
          trendUp={true}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={Timer}
          title="Avg Approval"
          value={`${analytics?.avgProcessingDays ?? 0}d`}
          sub="Turnaround time"
          trend={`${analytics?.taskApprovalRate ?? 0}% task approval`}
          trendUp={(analytics?.taskApprovalRate ?? 0) >= 50}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project Progress Summary */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Project Progress Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Where your effort is spent</p>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 3).map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700 truncate max-w-[150px]">{p.title}</span>
                  <span className="font-bold text-violet-600">{p.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
            {total === 0 && <p className="text-xs text-slate-400 text-center py-8">No active projects</p>}
            {total > 3 && (
              <Link to="/employee/projects" className="block text-center text-xs font-semibold text-violet-600 hover:text-violet-700 pt-2">
                View all projects
              </Link>
            )}
          </div>
        </div>

        {/* Line chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Monthly Submission Trend</h2>
            <p className="text-xs text-slate-400 mt-0.5">Number of projects submitted per month</p>
          </div>
          <LineChart data={submissionLine} color="#7c3aed" label="Submissions" height={160} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task Overview panel */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">My Task Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Progress on assigned tasks</p>
            </div>
            <Link to="/employee/tasks" className="flex items-center gap-1 text-xs font-medium text-violet-600">View <ArrowRight size={12} /></Link>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <svg width="90" height="90" viewBox="0 0 90 90" className="flex-shrink-0">
              <circle cx="45" cy="45" r={R} fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle cx="45" cy="45" r={R} fill="none" stroke="#7c3aed" strokeWidth="10" strokeDasharray={`${filled} ${C - filled}`} strokeLinecap="round" transform="rotate(-90 45 45)" />
              <text x="45" y="49" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">{taskRate}%</text>
            </svg>
            <div className="space-y-1.5 flex-1">
              {[{ l: "Completed", v: taskCompleted, c: "text-emerald-600" }, { l: "In Review", v: taskUnderReview, c: "text-indigo-600" }, { l: "Pending", v: taskPending, c: "text-amber-600" }, { l: "Rejected", v: taskRejected, c: "text-red-500" }].map(s => (
                <div key={s.l} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{s.l}</span>
                  <span className={`font-bold ${s.c}`}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          {taskTotal > 0 && (
            <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-violet-50 px-3 py-2.5 text-center">
                <p className="text-base font-black text-violet-700">{analytics?.taskApprovalRate ?? 0}%</p>
                <p className="text-[10px] text-violet-400 font-medium">Approval Rate</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                <p className="text-base font-black text-slate-700">{analytics?.avgProcessingDays ?? 0}d</p>
                <p className="text-[10px] text-slate-400 font-medium">Avg Time</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Recent Projects</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your latest updates</p>
            </div>
            <Link to="/employee/projects" className="flex items-center gap-1 text-xs font-medium text-violet-600">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 5).map((p: any) => (
              <Link key={p.id} to={`/employee/project/${p.rawId}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-violet-700">{p.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.id} · <span className="text-emerald-600 font-medium">{p.slaStatus}</span></p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-16 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{p.progress}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
