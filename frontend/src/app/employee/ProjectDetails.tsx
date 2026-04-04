import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Loader2
} from "lucide-react";
import { api } from "../services/api";

const SLA_STYLES: Record<string, string> = {
  "On Time": "bg-emerald-50 text-emerald-700",
  Breached: "bg-red-50 text-red-700",
  "At Risk": "bg-amber-50 text-amber-700",
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTask, setMyTask] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id]);

  async function fetchProject() {
    try {
      setLoading(true);
      setError(null);
      const numericId = Number(id);
      const [data, tasks, taskStats] = await Promise.all([
        api.employee.getProject<any>(numericId),
        api.employee.getMyTasks<any[]>(),
        api.employee.getProjectTaskStats<any>(),
      ]);
      const projectStats = taskStats?.[numericId] || taskStats?.[String(numericId)];
      const totalTasks = Number(projectStats?.total) || 0;
      const completedTasks = Number(projectStats?.completed) || 0;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const mapped = {
        id: "PRJ-" + String(data.id).padStart(3, "0"),
        rawId: data.id,
        title: data.title,
        description: data.description ?? "No description provided.",
        client: data.clientName ?? data.client ?? "—",
        budget: data.budget ?? 0,
        createdDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
        slaDeadline: data.slaDeadline ? new Date(data.slaDeadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
        slaStatus: data.slaStatus ?? "On Time",
        priority: data.priority ?? "Medium",
        riskCategory: data.riskCategory ?? "—",
        timeline: data.timeline ?? "—",
        department: data.department ?? "General",
        progress,
        resourceRequirement: data.resourceRequirement ?? "No resource requirements specified.",
      };
      setProject(mapped);

      try {
        const taskList = Array.isArray(tasks) ? tasks : [];
        const found = taskList.find((t: any) => t.projectId === numericId);
        setMyTask(found ?? null);
      } catch { /* ignore */ }

      try {
        const [timelineResult, submissionsResult] = await Promise.allSettled([
          api.projects.getTimeline(numericId),
          api.projects.getSubmissions(numericId),
        ]);

        const tl = timelineResult.status === "fulfilled" ? timelineResult.value : [];
        const submissions = submissionsResult.status === "fulfilled" ? submissionsResult.value : [];
        const taskList = Array.isArray(tasks) ? tasks : [];
        const myProjectTasks = taskList.filter((task: any) => Number(task.projectId) === numericId);

        const timelineEvents = Array.isArray(tl)
          ? tl.map((e: any) => ({
              id: e.id ?? `timeline-${Math.random()}`,
              action: e.action ?? e.event ?? "Update",
              rawDate: e.date ?? null,
              date: e.date ? new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
              actor: e.actor ?? e.actorName ?? "System",
              role: e.role ?? "",
              note: e.note ?? e.comment ?? null,
              status: (e.status ?? "info").toLowerCase(),
            }))
          : [];

        const taskFallbackEvents = myProjectTasks.flatMap((task: any) => {
          const events: any[] = [];
          const formatDate = (value: string | null | undefined) =>
            value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
          const buildPhaseEvents = (phaseNumber: 1 | 2 | 3) => {
            const status = task[`phase${phaseNumber}Status`];
            const note = task[`phase${phaseNumber}Note`];
            const repositoryLink = task[`phase${phaseNumber}RepoLink`];
            const feedback = task[`phase${phaseNumber}Feedback`];
            const description = task[`phase${phaseNumber}Description`] || task.description || task.title;
            const hasSubmission = Boolean(note || repositoryLink || status === "SUBMITTED" || status === "APPROVED" || status === "REJECTED");

            if (hasSubmission) {
              events.push({
                id: `task-phase-${phaseNumber}-submission-${task.id}`,
                action: `Phase ${phaseNumber} Submitted`,
                rawDate: task.submittedAt || task.createdAt,
                date: formatDate(task.submittedAt || task.createdAt),
                actor: task.assignedToName ?? "Employee",
                role: `Phase ${phaseNumber} Submission`,
                taskTitle: task.title,
                description,
                note: note || `${task.title} submitted in phase ${phaseNumber}`,
                repositoryLink: repositoryLink ?? null,
                nextStep: status === "APPROVED" ? `Phase ${phaseNumber} approved` : `Waiting for Phase ${phaseNumber} approval`,
                status: "submission",
              });
            }

            if (status === "APPROVED" || status === "REJECTED") {
              events.push({
                id: `task-phase-${phaseNumber}-review-${task.id}`,
                action: status === "APPROVED" ? `Phase ${phaseNumber} Approved` : `Phase ${phaseNumber} Rejected`,
                rawDate: task.reviewedAt || task.submittedAt || task.createdAt,
                date: formatDate(task.reviewedAt || task.submittedAt || task.createdAt),
                actor: "Manager",
                role: `Phase ${phaseNumber} Review`,
                taskTitle: task.title,
                description,
                note: feedback || `${task.title} ${status === "APPROVED" ? "approved" : "reviewed"} in phase ${phaseNumber}`,
                nextStep: status === "APPROVED"
                  ? phaseNumber < 3 ? `Phase ${phaseNumber + 1} unlocked` : "All approvals complete"
                  : `Revision needed for Phase ${phaseNumber}`,
                status: status === "APPROVED" ? "approved" : "rejected",
              });
            }
          };

          buildPhaseEvents(1);
          buildPhaseEvents(2);
          buildPhaseEvents(3);
          return events;
        });

        const submissionEvents = Array.isArray(submissions)
          ? submissions.flatMap((submission: any) => {
              const events: any[] = [];
              const formatDate = (value: string | null | undefined) =>
                value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
              const buildPhaseEvents = (phaseNumber: 1 | 2 | 3) => {
                const status = submission[`phase${phaseNumber}Status`];
                const note = submission[`phase${phaseNumber}Note`];
                const repositoryLink = submission[`phase${phaseNumber}RepoLink`];
                const feedback = submission[`phase${phaseNumber}Feedback`];
                const phaseDescription = submission[`phase${phaseNumber}Description`] || submission.taskDescription || submission.taskTitle;
                const hasSubmission = Boolean(note || repositoryLink || status === "SUBMITTED" || status === "APPROVED" || status === "REJECTED");

                if (hasSubmission) {
                  events.push({
                    id: `phase-${phaseNumber}-submission-${submission.taskId}`,
                    action: `Phase ${phaseNumber} Submitted`,
                    rawDate: submission.submittedAt || submission.createdAt,
                    date: formatDate(submission.submittedAt || submission.createdAt),
                    actor: submission.employeeName ?? "Employee",
                    role: `Phase ${phaseNumber} Submission`,
                    taskTitle: submission.taskTitle,
                    description: phaseDescription,
                    note: note || `${submission.taskTitle} submitted in phase ${phaseNumber}`,
                    repositoryLink: repositoryLink ?? null,
                    nextStep: status === "APPROVED" ? `Phase ${phaseNumber} approved` : `Waiting for Phase ${phaseNumber} approval`,
                    status: "submission",
                  });
                }

                if (status === "APPROVED" || status === "REJECTED") {
                  events.push({
                    id: `phase-${phaseNumber}-review-${submission.taskId}`,
                    action: status === "APPROVED" ? `Phase ${phaseNumber} Approved` : `Phase ${phaseNumber} Rejected`,
                    rawDate: submission.reviewedAt || submission.submittedAt || submission.createdAt,
                    date: formatDate(submission.reviewedAt || submission.submittedAt || submission.createdAt),
                    actor: "Manager",
                    role: `Phase ${phaseNumber} Review`,
                    taskTitle: submission.taskTitle,
                    description: phaseDescription,
                    note: feedback || `${submission.taskTitle} ${status === "APPROVED" ? "approved" : "reviewed"} in phase ${phaseNumber}`,
                    nextStep: status === "APPROVED"
                      ? phaseNumber < 3 ? `Phase ${phaseNumber + 1} unlocked` : "All approvals complete"
                      : `Revision needed for Phase ${phaseNumber}`,
                    status: status === "APPROVED" ? "approved" : "rejected",
                  });
                }
              };

              buildPhaseEvents(1);
              buildPhaseEvents(2);
              buildPhaseEvents(3);

              return events;
            })
          : [];

        const mergedTimeline = [...timelineEvents, ...submissionEvents, ...taskFallbackEvents]
          .filter((event) => event.rawDate)
          .filter((event, index, self) => index === self.findIndex((candidate) => candidate.id === event.id))
          .sort((a, b) => {
            const phaseMatchA = String(a.action).match(/Phase (\d+)/);
            const phaseMatchB = String(b.action).match(/Phase (\d+)/);
            const phaseA = phaseMatchA ? Number(phaseMatchA[1]) : 0;
            const phaseB = phaseMatchB ? Number(phaseMatchB[1]) : 0;
            if (phaseA !== phaseB) return phaseA - phaseB;

            const actionOrder = (action: string) => {
              if (action.includes("Submitted")) return 1;
              if (action.includes("Approved")) return 2;
              if (action.includes("Rejected")) return 3;
              return 4;
            };

            const actionDiff = actionOrder(String(a.action)) - actionOrder(String(b.action));
            if (actionDiff !== 0) return actionDiff;

            return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
          });

        setTimeline(mergedTimeline);
      } catch { /* ignore */ }
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-violet-500" />
        <p className="text-sm">Loading project details…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <XCircle size={40} className="text-slate-200" />
        <p className="text-sm font-medium">{error ?? "Project not found"}</p>
        <Link to="/employee/projects" className="text-xs text-violet-600 hover:underline">
          ← Back to My Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs text-slate-400">My Projects</span>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
          {project.title}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {project.id}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STYLES[project.slaStatus] ?? SLA_STYLES["On Time"]}`}>
                SLA: {project.slaStatus}
              </span>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{project.progress}% Complete</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">{project.title}</h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl">{project.description}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: User, label: "Client", val: project.client },
            { icon: DollarSign, label: "Budget", val: `$${Number(project.budget).toLocaleString()}` },
            { icon: Calendar, label: "Created", val: project.createdDate },
            { icon: Calendar, label: "SLA Deadline", val: project.slaDeadline },
            { icon: Tag, label: "Priority", val: project.priority },
            { icon: AlertTriangle, label: "Risk", val: project.riskCategory },
            { icon: Clock, label: "Timeline", val: project.timeline },
            { icon: MessageSquare, label: "Department", val: project.department },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Icon size={11} />
                <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Overall Progress</h2>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center gap-3">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * project.progress) / 100} className="text-violet-500" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex flex-col">
                  <span className="text-xl font-bold text-slate-800">{project.progress}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">DONE</span>
                </div>
              </div>
              <p className="text-xs text-center text-slate-500 leading-relaxed font-medium">Your project is {project.progress}% towards completion.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Timeline Events</h2>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No events recorded yet.</p>
              ) : (
                timeline.map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-violet-400 mt-1.5" />
                      <div className="w-px flex-1 bg-slate-100 my-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800">{e.action}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>{e.date}</span>
                        <span>•</span>
                        <span>{e.actor} ({e.role})</span>
                      </div>
                      {e.taskTitle && (
                        <p className="mt-1.5 text-xs font-semibold text-slate-700">{e.taskTitle}</p>
                      )}
                      {e.description && (
                        <p className="mt-1 text-xs text-slate-500">{e.description}</p>
                      )}
                      {e.note && <p className="mt-1.5 text-xs text-slate-500 italic bg-slate-50 rounded px-2 py-1">“{e.note}”</p>}
                      {e.repositoryLink && (
                        <a
                          href={e.repositoryLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center rounded-md bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                        >
                          {e.repositoryLink}
                        </a>
                      )}
                      {e.nextStep && (
                        <p className="mt-1.5 text-[11px] font-medium text-slate-600">
                          Next: {e.nextStep}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
