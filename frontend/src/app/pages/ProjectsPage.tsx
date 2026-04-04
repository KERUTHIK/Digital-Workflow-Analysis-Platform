import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Send,
  Link2,
  GitBranch
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Project, Team, WorkflowTemplate } from "../mockData";

const STAGES = ["Initial Request", "Tech Review", "Budget Approval", "Security Check", "Final Sign-off"];
const DEPARTMENTS = ["All", "IT Ops", "Sales Tech", "HR", "Finance", "DevOps", "Security", "AI/ML", "Mobile", "Procurement", "IoT", "Education", "Innovation", "Marketing"];


function slaColor(sla: string) {
  if (sla === "On Time") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (sla === "Breached") return "bg-red-50 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function priorityDot(p: string) {
  if (p === "High") return "bg-red-500";
  if (p === "Medium") return "bg-amber-500";
  return "bg-slate-400";
}

function formatBudget(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function formatTaskBadge(status: string) {
  const normalized = (status || "").toUpperCase();
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized.includes("REVIEW")) return "IN REVIEW";
  return "PENDING";
}

function taskRowStyles(status: string) {
  const normalized = (status || "").toUpperCase();
  if (normalized === "COMPLETED") {
    return {
      iconWrap: "bg-emerald-100 text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      border: "border-slate-100",
      icon: CheckCircle,
    };
  }
  if (normalized === "REJECTED") {
    return {
      iconWrap: "bg-red-100 text-red-600",
      badge: "bg-red-100 text-red-700",
      border: "border-red-200",
      icon: AlertTriangle,
    };
  }
  if (normalized.includes("REVIEW")) {
    return {
      iconWrap: "bg-blue-100 text-blue-600",
      badge: "bg-blue-50 text-blue-600",
      border: "border-blue-200",
      icon: Clock,
    };
  }
  return {
    iconWrap: "bg-blue-100 text-blue-600",
    badge: "bg-blue-50 text-blue-600",
    border: "border-slate-100",
    icon: Clock,
  };
}

function fileIcon(type: string) {
  const icons: Record<string, string> = { pdf: "🔴", xlsx: "🟢", docx: "🔵", fig: "🟣" };
  return icons[type] || "📄";
}

// ─── Project Detail Panel ────────────────────────────────────────────────────

function ProjectDetailPanel({
  project,
  onClose,
  onEdit,
  onDelete,
}: {
  project: Project;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [activeSection, setActiveSection] = useState("overview");
  const [timeline, setTimeline] = useState([] as any[]);
  const [submissions, setSubmissions] = useState([] as any[]);
  const [_loading, setLoading] = useState(false);

  const pid = Number(project.rawId ?? Number(project.id.replace("PRJ-", "")));

  useEffect(() => {
    fetchProjectDetails();
  }, [project.id]);

  async function fetchProjectDetails() {
    setLoading(true);

    try {
      const timelineResult = await api.projects.getTimeline(pid);
      setTimeline(Array.isArray(timelineResult) ? timelineResult : []);
    } catch (err) {
      console.error("Failed to fetch project timeline", err);
      setTimeline([]);
    }

    try {
      const managerTasks = await api.manager.getProjectTasks(pid);
      const mappedTasks = (Array.isArray(managerTasks) ? managerTasks : []).map((task: any) => ({
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        status: task.status,
        employeeName: task.assignedToName,
        employeeEmail: task.assignedToEmail,
        submittedNote:
          task.submittedNote ?? task.phase3Note ?? task.phase2Note ?? task.phase1Note,
        repositoryLink:
          task.repositoryLink ?? task.phase3RepoLink ?? task.phase2RepoLink ?? task.phase1RepoLink,
        createdAt: task.createdAt,
        submittedAt: task.submittedAt,
        reviewedAt: task.reviewedAt,
        managerFeedback: task.managerFeedback ?? task.phase3Feedback ?? task.phase2Feedback ?? task.phase1Feedback,
        currentPhase: task.currentPhase,
        phase1Status: task.phase1Status,
        phase2Status: task.phase2Status,
        phase3Status: task.phase3Status,
        phase1Note: task.phase1Note,
        phase2Note: task.phase2Note,
        phase3Note: task.phase3Note,
        phase1RepoLink: task.phase1RepoLink,
        phase2RepoLink: task.phase2RepoLink,
        phase3RepoLink: task.phase3RepoLink,
        phase1Feedback: task.phase1Feedback,
        phase2Feedback: task.phase2Feedback,
        phase3Feedback: task.phase3Feedback,
      }));
      setSubmissions(mappedTasks);
    } catch (managerErr) {
      console.error("Failed to fetch manager project tasks", managerErr);

      try {
        const submissionsData = await api.projects.getSubmissions(pid);
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      } catch (submissionsErr) {
        console.error("Failed to fetch project submissions", submissionsErr);
        setSubmissions([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    try {
      await api.manager.approve(pid, { comment: "Approved via dashboard" });
      onClose();
      // We should ideally trigger a refresh of the project list here
    } catch (err: any) {
      alert(err.message || "Failed to approve project");
    }
  }

  async function handleReject() {
    try {
      await api.manager.reject(pid, { comment: "Rejected via dashboard" });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to reject project");
    }
  }


  const displayTimeline = useMemo(() => {
    const phaseEvents = (Array.isArray(submissions) ? submissions : []).flatMap((submission: any) => {
      const events: any[] = [];
      const formatDate = (value: string | null | undefined) =>
        value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

      const buildPhaseEvents = (phaseNumber: 1 | 2 | 3) => {
        const status = submission[`phase${phaseNumber}Status`];
        const note = submission[`phase${phaseNumber}Note`];
        const repositoryLink = submission[`phase${phaseNumber}RepoLink`];
        const feedback = submission[`phase${phaseNumber}Feedback`];
        const phaseDescription = submission[`phase${phaseNumber}Description`] || submission.taskDescription || submission.taskTitle;
        const phaseStatus = String(status || "").toUpperCase();
        const hasSubmission = Boolean(
          note ||
          repositoryLink ||
          phaseStatus === "SUBMITTED" ||
          phaseStatus === "APPROVED" ||
          phaseStatus === "REJECTED"
        );

        if (hasSubmission) {
          events.push({
            id: `phase-${phaseNumber}-submission-${submission.taskId}`,
            action: `Phase ${phaseNumber} Submitted`,
            actor: submission.employeeName ?? "Employee",
            note: note || `${submission.taskTitle} submitted for phase ${phaseNumber}`,
            status: "submission",
            rawDate: submission.submittedAt || submission.createdAt || null,
            date: formatDate(submission.submittedAt || submission.createdAt),
            taskTitle: submission.taskTitle || "",
            description: phaseDescription || "",
            repositoryLink: repositoryLink || "",
            nextStep: `Waiting for Phase ${phaseNumber} review`,
            phase: phaseNumber,
            step: "submitted",
          });
        }

        if (phaseStatus === "APPROVED" || phaseStatus === "REJECTED") {
          events.push({
            id: `phase-${phaseNumber}-review-${submission.taskId}`,
            action: phaseStatus === "APPROVED" ? `Phase ${phaseNumber} Approved` : `Phase ${phaseNumber} Rejected`,
            actor: "Manager",
            note: feedback || `${submission.taskTitle} ${phaseStatus === "APPROVED" ? "approved" : "rejected"} in phase ${phaseNumber}`,
            status: phaseStatus === "APPROVED" ? "approved" : "rejected",
            rawDate: submission.reviewedAt || submission.submittedAt || submission.createdAt || null,
            date: formatDate(submission.reviewedAt || submission.submittedAt || submission.createdAt),
            taskTitle: submission.taskTitle || "",
            description: phaseDescription || "",
            repositoryLink: "",
            nextStep: phaseStatus === "APPROVED"
              ? (phaseNumber < 3 ? `Phase ${phaseNumber + 1} unlocked` : "All phases complete")
              : `Revision needed for Phase ${phaseNumber}`,
            phase: phaseNumber,
            step: phaseStatus === "APPROVED" ? "approved" : "rejected",
          });
        }
      };

      buildPhaseEvents(1);
      buildPhaseEvents(2);
      buildPhaseEvents(3);
      return events;
    });

    const merged = phaseEvents
      .filter((event) => event.rawDate)
      .filter((event, index, all) => index === all.findIndex((candidate) => candidate.id === event.id))
      .sort((a, b) => {
        if (a.phase !== b.phase) return a.phase - b.phase;
        const stepRank = (step: string) => {
          if (step === "submitted") return 1;
          if (step === "approved") return 2;
          if (step === "rejected") return 3;
          return 4;
        };
        const rankDiff = stepRank(a.step) - stepRank(b.step);
        if (rankDiff !== 0) return rankDiff;
        return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
      });

    if (merged.length > 0) return merged;

    // Fallback to backend timeline when no phase events exist.
    return (Array.isArray(timeline) ? timeline : [])
      .map((event: any) => ({
        id: String(event.id ?? `timeline-${Math.random()}`),
        action: event.action ?? event.event ?? "Update",
        actor: event.actor ?? "System",
        note: event.note ?? event.comment ?? "",
        status: String(event.status ?? "info").toLowerCase(),
        rawDate: event.date ?? null,
        date: event.date
          ? new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : "N/A",
        taskTitle: "",
        description: "",
        repositoryLink: "",
        nextStep: "",
      }))
      .filter((event: any) => event.rawDate)
      .sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
  }, [timeline, submissions]);

  const tabs = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "timeline", label: `Timeline (${displayTimeline.length})`, icon: Clock },
    { key: "submissions", label: `Submissions (${submissions.length})`, icon: GitBranch },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{project.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${slaColor(project.slaStatus)}`}>{project.slaStatus}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{project.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{project.client} · {project.department}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Budget", value: formatBudget(project.budget), icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Manager", value: project.manager, icon: User, color: "text-blue-600 bg-blue-50" },
                  { label: "Priority", value: project.priority, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
                  { label: "Created", value: project.createdDate, icon: Calendar, color: "text-purple-600 bg-purple-50" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-semibold text-slate-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
              </div>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Project Tasks</h4>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {submissions.length} Total
                  </span>
                </div>
                {submissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                    No tasks have been assigned yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((task: any) => {
                      const styles = taskRowStyles(task.status);
                      const Icon = styles.icon;

                      return (
                        <div
                          key={task.taskId}
                          className={`flex items-center justify-between rounded-2xl border bg-white p-4 transition-all ${styles.border}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconWrap}`}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{task.taskTitle}</p>
                              <p className="text-xs font-medium text-slate-400">
                                Phase {task.currentPhase || 1} · Assigned to {task.employeeName || "Employee"}
                              </p>
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles.badge}`}>
                            {formatTaskBadge(task.status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Overall Project Progress</span>
                  <span className="font-semibold">{project.progress}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {activeSection === "timeline" && (
            <div className="space-y-3">
              {displayTimeline.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No events yet</div>
              ) : (
                displayTimeline.map((event: any) => (
                  <div key={event.id} className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs font-semibold text-indigo-600">{event.action}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span>{event.actor}</span>
                    </div>
                    {event.taskTitle ? (
                      <p className="mt-2 text-xs font-semibold text-slate-700">{event.taskTitle}</p>
                    ) : null}
                    {event.description ? (
                      <p className="mt-1 text-xs text-slate-500">{event.description}</p>
                    ) : null}
                    {event.note ? (
                      <p className="mt-2 rounded-md bg-slate-50 px-2 py-1 text-xs italic text-slate-500">"{event.note}"</p>
                    ) : null}
                    {event.repositoryLink ? (
                      <a
                        href={event.repositoryLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        {event.repositoryLink}
                      </a>
                    ) : null}
                    {event.nextStep ? (
                      <p className="mt-2 text-[11px] font-medium text-slate-600">Next: {event.nextStep}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}

          {activeSection === "submissions" && (
            <div className="space-y-3">
              {submissions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <GitBranch size={32} className="mb-2 opacity-30" />
                  <p className="text-sm font-medium">No tasks assigned yet</p>
                  <p className="text-xs mt-1">Task submissions from employees will appear here</p>
                </div>
              )}
              {submissions.map((sub: any) => {
                const statusStyles: Record<string, string> = {
                  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
                  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
                  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  REJECTED: "bg-red-50 text-red-700 border-red-200",
                };
                const statusLabel: Record<string, string> = {
                  PENDING: "Pending",
                  UNDER_REVIEW: "Under Review",
                  COMPLETED: "Approved",
                  REJECTED: "Rejected",
                };
                const phase = Number(sub.currentPhase) || 1;
                const phaseLinks = [
                  { phase: 1, link: sub.phase1RepoLink },
                  { phase: 2, link: sub.phase2RepoLink },
                  { phase: 3, link: sub.phase3RepoLink },
                ].filter((entry) => Boolean(entry.link));
                const fallbackRepoLink = sub.repositoryLink;
                return (
                  <div key={sub.taskId} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{sub.taskTitle}</p>
                        {sub.taskDescription && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{sub.taskDescription}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyles[sub.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {statusLabel[sub.status] || sub.status}
                      </span>
                    </div>

                    {/* Employee info */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
                        <User size={12} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {sub.employeeName} · Phase {phase}
                      </span>
                      {sub.submittedAt && (
                        <span className="text-xs text-slate-400 ml-auto">Submitted {sub.submittedAt.split("T")[0]}</span>
                      )}
                    </div>

                    {/* Note */}
                    {sub.submittedNote && (
                      <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Note</p>
                        <p className="text-xs text-slate-600">{sub.submittedNote}</p>
                      </div>
                    )}

                    {/* Repo Link */}
                    {phaseLinks.length > 0 ? (
                      <div className="space-y-2">
                        {phaseLinks.map((entry) => (
                          <a
                            key={`phase-link-${sub.taskId}-${entry.phase}`}
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <Link2 size={12} />
                            <span className="truncate">Phase {entry.phase} · {entry.link}</span>
                          </a>
                        ))}
                      </div>
                    ) : fallbackRepoLink ? (
                      <a
                        href={fallbackRepoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <Link2 size={12} />
                        <span className="truncate">Phase {phase} · {fallbackRepoLink}</span>
                      </a>
                    ) : sub.status !== "PENDING" ? (
                      <p className="text-xs text-slate-400 italic">No repository link provided</p>
                    ) : null}

                    {/* Manager Feedback */}
                    {sub.managerFeedback && (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Manager Feedback</p>
                        <p className="text-xs text-amber-800">{sub.managerFeedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Edit2 size={14} />
            Edit Project
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateProjectModal({
  onClose,
  project
}: {
  onClose: () => void;
  project?: Project;
}) {
  const isEdit = !!project;
  const [form, setForm] = useState<any>({
    title: project?.title ?? "",
    client: project?.client ?? "",
    budget: project?.budget ?? "",
    timeline: project?.timeline ?? "",
    priority: project?.priority ?? "Medium",
    teamId: project?.teamId ?? "",
    progress: project?.progress ?? 0,
    description: project?.description ?? "",
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [_loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const tData = await api.teams.getAll<Team[]>();
      const wData = await api.workflows.getAll<WorkflowTemplate[]>();
      setTeams(tData || []);
      setWorkflows(wData || []);

      // Select first workflow by default
      if (wData.length > 0) {
        up("workflow", wData[0].name);
      }
    } catch (err) {
      console.error("Failed to fetch teams/workflows", err);
    }
  }

  const up = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  async function handleSubmit() {
    try {
      setLoading(true);
      const payload = {
        title: form.title,
        description: form.description,
        clientName: form.client,
        budget: Number(form.budget),
        teamId: form.teamId ? Number(form.teamId) : null,
        progress: Number(form.progress),
        priority: form.priority,
      };

      if (isEdit) {
        await api.employee.updateProject(Number(project.rawId), payload);
      } else {
        const currentUserStr = localStorage.getItem("nexusflow_user");
        let isAdmin = false;
        if (currentUserStr) {
          const u = JSON.parse(currentUserStr);
          isAdmin = u.role === "ADMIN" || u.role === "System Admin";
        }

        if (isAdmin) {
          await api.admin.createProject(payload);
        } else {
          await api.employee.createProject(payload);
        }
      }

      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); onClose(); }, 1800);
    } catch (err: any) {
      console.error("Save project error:", err);
      alert(err.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEdit ? "Edit Project" : "Create New Project"}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEdit ? "Update project details and team assignment" : "Fill in the details to submit for workflow approval"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle size={32} />
              </div>
              <p className="text-base font-bold text-slate-900">Project Submitted!</p>
              <p className="text-sm text-slate-500 mt-1">Your project has been sent for approval.</p>
            </div>
          ) : (
            <>
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => up("title", e.target.value)}
                  placeholder="e.g. Cloud Migration Initiative"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.client}
                  onChange={(e) => up("client", e.target.value)}
                  placeholder="e.g. Acme Corp or Internal IT"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>

              {/* Budget + Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget (USD)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      value={form.budget}
                      onChange={(e) => up("budget", e.target.value)}
                      placeholder="150000"
                      className="w-full rounded-lg border border-slate-200 pl-8 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Timeline</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="date"
                      value={form.timeline}
                      onChange={(e) => up("timeline", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 pl-8 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Priority + Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => up("priority", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Assignment</label>
                  <select
                    value={form.teamId}
                    onChange={(e) => up("teamId", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  >
                    <option value="">No Team</option>
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress removed - handled by dynamic task calculation */}




              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => up("description", e.target.value)}
                  placeholder="Brief project description and goals..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Send size={14} />
              {_loading ? "Saving..." : isEdit ? "Update Project" : "Submit for Approval"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [sortField, setSortField] = useState<keyof Project>("createdDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [totalProjects, setTotalProjects] = useState<number>(0);

  useEffect(() => {
    fetchProjects();
  }, [user, page, sortField, sortDir]);

  async function fetchProjects() {
    if (!user) return;
    try {
      setLoading(true);
      const params = {
        page: (page - 1).toString(),
        size: PAGE_SIZE.toString(),
        sortBy: sortField === "createdDate" ? "createdAt" : sortField,
        sortDir: sortDir,
      };

      const isManagerView = user.role === "Manager" || user.role === "MANAGER";
      const isAdminView = user.role === "System Admin" || user.role === "ADMIN";

      const [response, taskStats, teamsData] = await Promise.all([
        isAdminView
          ? api.admin.getProjects(params)
          : isManagerView
            ? api.manager.getTeamProjects(params)
            : api.employee.getMyProjects(params),
        isAdminView || isManagerView
          ? api.manager.getProjectTaskStats<any>()
          : Promise.resolve(null),
        api.teams.getAll<any[]>().catch(() => []),
      ]);
      const teamManagerById = new Map<number, string>(
        (Array.isArray(teamsData) ? teamsData : [])
          .filter((team: any) => team?.id != null && team?.managerName)
          .map((team: any) => [Number(team.id), String(team.managerName)])
      );

      const mapped: Project[] = (response.content || []).map((p: any) => {
        const projectStats = taskStats?.[p.id] || taskStats?.[String(p.id)];
        const totalTasks = Number(projectStats?.total) || 0;
        const completedTasks = Number(projectStats?.completed) || 0;
        const progress = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;
        const rawSla = p.slaStatus ?? p.sla;
        const derivedSla = (() => {
          if (rawSla) return String(rawSla);
          const deadlineRaw = p.slaDeadline ?? p.deadline;
          if (!deadlineRaw) return "N/A";
          const deadline = new Date(deadlineRaw);
          if (Number.isNaN(deadline.getTime())) return "N/A";
          return deadline.getTime() < Date.now() ? "Breached" : "On Time";
        })();

        return {
          id: "PRJ-" + p.id.toString().padStart(3, "0"),
          rawId: p.id,
          title: p.title,
          client: p.clientName,
          budget: p.budget,
          slaStatus: derivedSla,
          createdDate: p.createdAt ? p.createdAt.split("T")[0] : "",
          department: p.department || "General",
          teamId: p.teamId,
          teamName: p.teamName,
          description: p.description,
          manager: (p.teamId != null ? teamManagerById.get(Number(p.teamId)) : null) || p.createdByName,
          priority: p.priority || "Medium",
          progress,
          timeline: [],
          comments: [],
          attachments: [],
        };
      });

      setProjects(mapped);
      setTotalProjects(response.totalElements || mapped.length);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return projects.filter((p: Project) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchDept = deptFilter === "All" || p.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [projects, search, deptFilter]);

  const totalPages = Math.ceil(totalProjects / PAGE_SIZE);
  // Remove local slicing as server already provides paginated data
  const paged = filtered;

  function toggleSort(field: keyof Project) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ChevronDown size={13} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={13} className="text-indigo-500" /> : <ChevronDown size={13} className="text-indigo-500" />;
  }

  const columns: { label: string; field: keyof Project | null }[] = [
    { label: "Project", field: "title" },
    { label: "Team", field: "teamName" },
    { label: "Priority", field: "priority" },
    { label: "Budget", field: "budget" },
    { label: "Progress", field: "progress" },
    { label: "Created", field: "createdDate" },
    { label: "Actions", field: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalProjects} projects · manage approvals and workflows</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title, client, ID…"
            className="w-full rounded-lg bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-700 border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>
        {[
          { value: deptFilter, options: DEPARTMENTS, onChange: (v: string) => { setDeptFilter(v); setPage(1); } },
        ].map(({ value, options, onChange }, i) => (
          <div key={i} className="relative">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
            >
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
          <Filter size={13} />
          {filtered.length} results
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {columns.map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && toggleSort(field)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${field ? "cursor-pointer hover:text-slate-700 select-none" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((project: Project) => (
                <tr
                  key={project.id}
                  className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${priorityDot(project.priority)}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{project.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{project.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {project.teamName ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {project.teamName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Team</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${priorityDot(project.priority)}`} />
                      <span className="text-sm font-medium text-slate-700">{project.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-slate-800">{formatBudget(project.budget)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 min-w-[90px]">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${project.progress === 100
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                            : project.progress >= 50
                              ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                              : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                            }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-slate-500">{project.createdDate}</span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedProject(project)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        <Eye size={13} /> View
                      </button>
                      <button onClick={() => setEditingProject(project)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        <Edit2 size={13} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalProjects)}–{Math.min(page * PAGE_SIZE, totalProjects)} of {totalProjects}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${p === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onEdit={() => {
            setEditingProject(selectedProject);
            setSelectedProject(null);
          }}
          onDelete={() => {
            if (window.confirm("Are you sure you want to delete this project?")) {
              console.log("Delete project", selectedProject.id);
              setSelectedProject(null);
            }
          }}
        />
      )}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
      {editingProject && (
        <CreateProjectModal
          project={editingProject}
          onClose={() => {
            setEditingProject(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
