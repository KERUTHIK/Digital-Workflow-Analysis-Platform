import { useState, useEffect } from "react";
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    FolderKanban,
    ChevronDown,
    ChevronUp,
    Loader2,
    Send,
    X,
    GitBranch,
    Link2,
    AlertCircle,
    Lock,
    ChevronRight,
} from "lucide-react";
import { api } from "../services/api";

interface PhaseInfo {
    status: string;        // PENDING | SUBMITTED | APPROVED | REJECTED | LOCKED
    note: string | null;
    feedback: string | null;
    repoLink: string | null;
    description: string | null;
}

interface MyTask {
    id: number;
    projectId: number;
    projectTitle: string;
    assignedToId: number;
    assignedToName: string;
    title: string;
    description: string;
    dueDate: string;
    status: string; // PENDING | PHASE1_REVIEW | PHASE2_REVIEW | PHASE3_REVIEW | COMPLETED | REJECTED
    currentPhase: number;
    phase1Status: string;
    phase2Status: string;
    phase3Status: string;
    phase1Description: string | null;
    phase2Description: string | null;
    phase3Description: string | null;
    phase1Note: string | null;
    phase2Note: string | null;
    phase3Note: string | null;
    phase1Feedback: string | null;
    phase2Feedback: string | null;
    phase3Feedback: string | null;
    phase1RepoLink: string | null;
    phase2RepoLink: string | null;
    phase3RepoLink: string | null;
    managerFeedback: string | null;
    createdAt: string;
    submittedAt: string | null;
}

interface SubmitState {
    taskId: number | null;
    note: string;
    repositoryLink: string;
    loading: boolean;
    error: string | null;
}

// Phase names
const PHASE_LABELS = ["Phase 1 — Planning", "Phase 2 — Development", "Phase 3 — Delivery"];

// Status badge config
function phaseStatusBadge(status: string) {
    switch (status) {
        case "APPROVED": return { label: "Approved ✓", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
        case "SUBMITTED": return { label: "Under Review", cls: "bg-blue-100 text-blue-700 border-blue-200" };
        case "REJECTED": return { label: "Revision Required", cls: "bg-red-100 text-red-700 border-red-200" };
        case "PENDING": return { label: "Pending Submission", cls: "bg-amber-100 text-amber-700 border-amber-200" };
        case "LOCKED": return { label: "Locked", cls: "bg-slate-100 text-slate-400 border-slate-200" };
        default: return { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
    }
}

function getPhaseInfo(task: MyTask, phase: 1 | 2 | 3): PhaseInfo {
    return {
        status: phase === 1 ? task.phase1Status : phase === 2 ? task.phase2Status : task.phase3Status,
        note: phase === 1 ? task.phase1Note : phase === 2 ? task.phase2Note : task.phase3Note,
        feedback: phase === 1 ? task.phase1Feedback : phase === 2 ? task.phase2Feedback : task.phase3Feedback,
        repoLink: phase === 1 ? task.phase1RepoLink : phase === 2 ? task.phase2RepoLink : task.phase3RepoLink,
        description: phase === 1 ? task.phase1Description : phase === 2 ? task.phase2Description : task.phase3Description,
    };
}

function overallStatusBadge(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
        PENDING: { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
        PHASE1_REVIEW: { label: "Phase 1 In Review", cls: "bg-blue-50 text-blue-700 border-blue-200" },
        PHASE2_REVIEW: { label: "Phase 2 In Review", cls: "bg-blue-50 text-blue-700 border-blue-200" },
        PHASE3_REVIEW: { label: "Phase 3 In Review", cls: "bg-blue-50 text-blue-700 border-blue-200" },
        COMPLETED: { label: "Completed ✓", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        REJECTED: { label: "Revision Requested", cls: "bg-red-50 text-red-700 border-red-200" },
    };
    return map[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
}

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<MyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
    const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
    const [submitState, setSubmitState] = useState<SubmitState>({
        taskId: null, note: "", repositoryLink: "", loading: false, error: null,
    });

    useEffect(() => { loadTasks(); }, []);

    async function loadTasks() {
        setLoading(true);
        setError(null);
        try {
            const result = await api.employee.getMyTasks<MyTask[]>();
            const taskList = Array.isArray(result) ? result : [];
            setTasks(taskList);
            const projectIds = new Set(taskList.map((t) => t.projectId));
            setExpandedProjects(projectIds);
        } catch (err: any) {
            setError(err.message || "Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    }

    function toggleProject(projectId: number) {
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
            return next;
        });
    }

    function togglePhases(taskId: number) {
        setExpandedPhases((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
            return next;
        });
    }

    function openSubmitForm(taskId: number) {
        setSubmitState({ taskId, note: "", repositoryLink: "", loading: false, error: null });
    }

    function closeSubmitForm() {
        setSubmitState({ taskId: null, note: "", repositoryLink: "", loading: false, error: null });
    }

    async function handleSubmitPhase() {
        if (!submitState.taskId) return;
        setSubmitState((s) => ({ ...s, loading: true, error: null }));
        try {
            await api.employee.submitPhase(submitState.taskId, submitState.note, submitState.repositoryLink);
            closeSubmitForm();
            await loadTasks();
        } catch (err: any) {
            setSubmitState((s) => ({ ...s, loading: false, error: err.message || "Submission failed." }));
        }
    }

    // Group tasks by project
    const byProject = tasks.reduce<Record<number, { title: string; tasks: MyTask[] }>>((acc, t) => {
        if (!acc[t.projectId]) acc[t.projectId] = { title: t.projectTitle, tasks: [] };
        acc[t.projectId].tasks.push(t);
        return acc;
    }, {});

    // Summary counts
    const pending = tasks.filter((t) => t.status === "PENDING" || t.status === "REJECTED").length;
    const inReview = tasks.filter((t) => t.status.includes("REVIEW")).length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Track and submit your assigned tasks phase by phase</p>
                </div>
                <button
                    onClick={loadTasks}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ClipboardList size={13} />
                    Refresh
                </button>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-3">
                {[
                    { label: "Pending Action", count: pending, cls: "bg-amber-50 text-amber-700 border-amber-200" },
                    { label: "Under Review", count: inReview, cls: "bg-blue-50 text-blue-700 border-blue-200" },
                    { label: "Completed", count: completed, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    { label: "Total", count: tasks.length, cls: "bg-slate-50 text-slate-700 border-slate-200" },
                ].map((pill) => (
                    <div key={pill.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold ${pill.cls}`}>
                        <span className="text-lg font-bold">{pill.count}</span>
                        {pill.label}
                    </div>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={30} className="text-violet-500 animate-spin" />
                    <p className="text-sm text-slate-400">Loading tasks…</p>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
            )}

            {/* Empty */}
            {!loading && !error && tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                        <FolderKanban size={28} className="text-violet-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-slate-700">No tasks assigned yet</p>
                        <p className="text-sm text-slate-400 mt-1">Your manager hasn't assigned any tasks to you.</p>
                    </div>
                </div>
            )}

            {/* Project groups */}
            {!loading && !error && Object.entries(byProject).map(([pid, group]) => {
                const projectId = Number(pid);
                const isExpanded = expandedProjects.has(projectId);
                return (
                    <div key={projectId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {/* Project header */}
                        <button
                            onClick={() => toggleProject(projectId)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                                    <FolderKanban size={16} className="text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{group.title}</p>
                                    <p className="text-xs text-slate-400">{group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}</p>
                                </div>
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>

                        {/* Tasks */}
                        {isExpanded && (
                            <div className="border-t border-slate-100 divide-y divide-slate-50">
                                {group.tasks.map((task) => {
                                    const overallBadge = overallStatusBadge(task.status);
                                    const phase = task.currentPhase as 1 | 2 | 3;
                                    const currentPhaseInfo = getPhaseInfo(task, phase);
                                    const canSubmit = task.status === "PENDING" || task.status === "REJECTED";
                                    const isSubmitting = submitState.taskId === task.id;
                                    const phasesExpanded = expandedPhases.has(task.id);

                                    return (
                                        <div key={task.id} className="px-5 py-4">
                                            {/* Task header */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${overallBadge.cls}`}>
                                                            {overallBadge.label}
                                                        </span>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                                                    )}
                                                    {task.dueDate && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                            <Clock size={11} />
                                                            Due {task.dueDate}
                                                        </div>
                                                    )}
                                                </div>
                                                {canSubmit && (
                                                    <button
                                                        onClick={() => openSubmitForm(task.id)}
                                                        className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
                                                    >
                                                        <Send size={11} />
                                                        Submit Phase {phase}
                                                    </button>
                                                )}
                                                {task.status === "COMPLETED" && (
                                                    <div className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                                        <CheckCircle2 size={11} />
                                                        All Phases Done
                                                    </div>
                                                )}
                                            </div>

                                            {/* Phase Stepper */}
                                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 mb-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                                        3-Phase Workflow
                                                    </p>
                                                    <button
                                                        onClick={() => togglePhases(task.id)}
                                                        className="text-[11px] text-violet-600 hover:underline font-medium flex items-center gap-0.5"
                                                    >
                                                        {phasesExpanded ? "Hide details" : "Show details"}
                                                        <ChevronRight size={11} className={`transition-transform ${phasesExpanded ? "rotate-90" : ""}`} />
                                                    </button>
                                                </div>

                                                {/* Compact Phase dots */}
                                                <div className="flex items-center gap-2">
                                                    {([1, 2, 3] as const).map((p) => {
                                                        const pi = getPhaseInfo(task, p);
                                                        const badge = phaseStatusBadge(pi.status ?? "LOCKED");
                                                        const dotCls =
                                                            pi.status === "APPROVED" ? "bg-emerald-500 border-emerald-500 text-white"
                                                                : pi.status === "SUBMITTED" ? "bg-blue-500 border-blue-500 text-white"
                                                                    : pi.status === "REJECTED" ? "bg-red-400 border-red-400 text-white"
                                                                        : pi.status === "PENDING" ? "bg-amber-400 border-amber-400 text-white"
                                                                            : "bg-slate-200 border-slate-200 text-slate-400";
                                                        return (
                                                            <div key={p} className="flex items-center gap-1.5 flex-1">
                                                                <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${dotCls}`}>
                                                                    {pi.status === "APPROVED" ? "✓" : pi.status === "REJECTED" ? "✗" : p}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-semibold text-slate-600 truncate">Phase {p}</p>
                                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
                                                                        {badge.label}
                                                                    </span>
                                                                </div>
                                                                {p < 3 && <div className="h-px flex-1 bg-slate-200" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Expanded phase details */}
                                                {phasesExpanded && (
                                                    <div className="mt-3 space-y-2.5">
                                                        {([1, 2, 3] as const).map((p) => {
                                                            const pi = getPhaseInfo(task, p);
                                                            const isLocked = pi.status === "LOCKED";
                                                            return (
                                                                <div
                                                                    key={p}
                                                                    className={`rounded-lg border px-3 py-2.5 ${isLocked ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-slate-200"}`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <p className="text-xs font-bold text-slate-700">{PHASE_LABELS[p - 1]}</p>
                                                                        {isLocked && <Lock size={11} className="text-slate-400" />}
                                                                    </div>
                                                                    {pi.description && (
                                                                        <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{pi.description}</p>
                                                                    )}
                                                                    {pi.note && (
                                                                        <div className="rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1.5 mb-1.5">
                                                                            <p className="text-[10px] font-semibold text-slate-400 mb-0.5">Your submission note</p>
                                                                            <p className="text-xs text-slate-600">{pi.note}</p>
                                                                        </div>
                                                                    )}
                                                                    {pi.repoLink && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-violet-600">
                                                                            <GitBranch size={11} />
                                                                            <a href={pi.repoLink} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                                                                {pi.repoLink}
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                    {pi.feedback && (
                                                                        <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-100 px-2.5 py-1.5">
                                                                            <p className="text-[10px] font-semibold text-amber-600 mb-0.5">Manager feedback</p>
                                                                            <p className="text-xs text-amber-800">{pi.feedback}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Inline submit form */}
                                            {isSubmitting && (
                                                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 mt-2">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-sm font-bold text-violet-800">
                                                            Submit Phase {phase} — {PHASE_LABELS[phase - 1]}
                                                        </p>
                                                        <button onClick={closeSubmitForm} className="text-slate-400 hover:text-slate-600">
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                    {currentPhaseInfo.description && (
                                                        <div className="mb-3 rounded-lg bg-white border border-violet-100 px-3 py-2">
                                                            <p className="text-xs font-semibold text-violet-600 mb-0.5">Phase requirements</p>
                                                            <p className="text-xs text-slate-600">{currentPhaseInfo.description}</p>
                                                        </div>
                                                    )}
                                                    <div className="space-y-2.5">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Submission Note</label>
                                                            <textarea
                                                                rows={3}
                                                                placeholder="Describe what you completed in this phase…"
                                                                value={submitState.note}
                                                                onChange={(e) => setSubmitState((s) => ({ ...s, note: e.target.value }))}
                                                                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 resize-none transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                                                <Link2 size={11} /> Repository / Work Link (optional)
                                                            </label>
                                                            <input
                                                                type="url"
                                                                placeholder="https://github.com/…"
                                                                value={submitState.repositoryLink}
                                                                onChange={(e) => setSubmitState((s) => ({ ...s, repositoryLink: e.target.value }))}
                                                                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all"
                                                            />
                                                        </div>
                                                        {submitState.error && (
                                                            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                                                                <AlertCircle size={13} />
                                                                {submitState.error}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={closeSubmitForm}
                                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={handleSubmitPhase}
                                                                disabled={submitState.loading}
                                                                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-60 shadow-sm"
                                                            >
                                                                {submitState.loading ? (
                                                                    <><Loader2 size={12} className="animate-spin" /> Submitting…</>
                                                                ) : (
                                                                    <><Send size={11} /> Submit Phase {phase}</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
