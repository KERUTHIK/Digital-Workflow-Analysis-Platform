import { useState, useEffect } from "react";
import {
    ClipboardCheck,
    CheckCircle2,
    RotateCcw,
    Loader2,
    GitBranch,
    Link2,
    Eye,
    X,
    FileText,
    ChevronRight,
} from "lucide-react";
import { api } from "../services/api";

interface TaskReview {
    id: number;
    projectId: number;
    projectTitle: string;
    assignedToId: number;
    assignedToName: string;
    assignedToEmail: string;
    title: string;
    description: string;
    dueDate: string;
    status: string;
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
    submittedNote: string | null;
    repositoryLink: string | null;
    submittedAt: string | null;
}

interface RejectState {
    taskId: number | null;
    feedback: string;
    loading: boolean;
}

const PHASE_LABELS = ["Phase 1 — Planning", "Phase 2 — Development", "Phase 3 — Delivery"];

function getPhaseNote(task: TaskReview, phase: number): string | null {
    return phase === 1 ? task.phase1Note : phase === 2 ? task.phase2Note : task.phase3Note;
}

function getPhaseRepoLink(task: TaskReview, phase: number): string | null {
    return phase === 1 ? task.phase1RepoLink : phase === 2 ? task.phase2RepoLink : task.phase3RepoLink;
}

function getPhaseDescription(task: TaskReview, phase: number): string | null {
    return phase === 1 ? task.phase1Description : phase === 2 ? task.phase2Description : task.phase3Description;
}

function getPhaseStatus(task: TaskReview, phase: number): string {
    return (phase === 1 ? task.phase1Status : phase === 2 ? task.phase2Status : task.phase3Status) ?? "LOCKED";
}

export default function TaskReviewPage() {
    const [tasks, setTasks] = useState<TaskReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [rejectState, setRejectState] = useState<RejectState>({ taskId: null, feedback: "", loading: false });

    useEffect(() => { loadReviews(); }, []);

    async function loadReviews() {
        setLoading(true);
        setError(null);
        try {
            const result = await api.manager.getTaskReviews<TaskReview[]>();
            setTasks(Array.isArray(result) ? result : []);
        } catch (err: any) {
            setError(err.message || "Failed to load reviews.");
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(taskId: number) {
        setApprovingId(taskId);
        try {
            await api.manager.approveTask(taskId);
            await loadReviews();
        } catch { /* handled silently */ }
        finally { setApprovingId(null); }
    }

    async function handleReject() {
        if (!rejectState.taskId) return;
        setRejectState((s) => ({ ...s, loading: true }));
        try {
            await api.manager.rejectTask(rejectState.taskId, rejectState.feedback);
            setRejectState({ taskId: null, feedback: "", loading: false });
            await loadReviews();
        } catch {
            setRejectState((s) => ({ ...s, loading: false }));
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Task Reviews</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Review phase submissions from your team — approve to unlock the next phase
                    </p>
                </div>
                {tasks.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm">
                        <Eye size={14} className="text-amber-600" />
                        <span className="font-semibold text-amber-700">{tasks.length}</span>
                        <span className="text-amber-600">awaiting review</span>
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={30} className="text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-400">Loading submissions…</p>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
            )}

            {/* Empty state */}
            {!loading && !error && tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <ClipboardCheck size={28} className="text-emerald-500" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-slate-700">No pending reviews</p>
                        <p className="text-sm text-slate-400 mt-1">All submitted tasks have been reviewed.</p>
                    </div>
                </div>
            )}

            {/* Review cards */}
            {!loading && !error && tasks.map((task) => {
                const isApproving = approvingId === task.id;
                const isRejecting = rejectState.taskId === task.id;
                const phase = task.currentPhase || 1;
                const phaseNote = getPhaseNote(task, phase);
                const phaseRepoLink = getPhaseRepoLink(task, phase);
                const phaseDescription = getPhaseDescription(task, phase);

                return (
                    <div key={task.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {/* Phase indicator banner */}
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-50 border-b border-indigo-100">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3].map((p) => {
                                    const ps = getPhaseStatus(task, p);
                                    const dotCls =
                                        ps === "APPROVED" ? "bg-emerald-500"
                                            : ps === "SUBMITTED" ? "bg-indigo-500 ring-2 ring-indigo-300 ring-offset-1"
                                                : ps === "REJECTED" ? "bg-red-400"
                                                    : ps === "PENDING" ? "bg-amber-400"
                                                        : "bg-slate-200";
                                    return (
                                        <div key={p} className="flex items-center">
                                            <div className={`h-2.5 w-2.5 rounded-full ${dotCls}`} />
                                            {p < 3 && <div className="h-px w-5 bg-slate-200" />}
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-xs font-bold text-indigo-700">
                                Reviewing {PHASE_LABELS[phase - 1]}
                            </span>
                            <span className="text-xs text-indigo-500">of 3</span>
                            <ChevronRight size={12} className="text-indigo-400" />
                            <span className="text-xs text-indigo-600 font-medium">
                                {phase < 3 ? `Approve to unlock Phase ${phase + 1}` : "Final phase — approve to complete task"}
                            </span>
                        </div>

                        {/* Card header */}
                        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                            <div className="flex items-start gap-3">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedToName)}&background=random&size=40`}
                                    alt={task.assignedToName}
                                    className="h-10 w-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                />
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{task.assignedToName}</p>
                                    <p className="text-xs text-slate-400">{task.assignedToEmail}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
                                            {task.projectTitle}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            Submitted {task.submittedAt ? new Date(task.submittedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <button
                                    onClick={() => setRejectState({ taskId: task.id, feedback: "", loading: false })}
                                    disabled={isApproving || isRejecting}
                                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw size={13} />
                                    Request Revision
                                </button>
                                <button
                                    onClick={() => handleApprove(task.id)}
                                    disabled={isApproving || isRejecting}
                                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {isApproving ? (
                                        <><Loader2 size={12} className="animate-spin" /> Approving…</>
                                    ) : (
                                        <><CheckCircle2 size={13} /> {phase < 3 ? `Approve Phase ${phase}` : "Complete Task"}</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Task details */}
                        <div className="px-5 py-4 space-y-3">
                            {/* Task title & description */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Task</p>
                                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                {task.description && (
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                                )}
                            </div>

                            {/* Phase requirements */}
                            {phaseDescription && (
                                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3">
                                    <p className="text-[11px] font-semibold text-indigo-600 mb-1">Phase {phase} Requirements</p>
                                    <p className="text-xs text-indigo-800 leading-relaxed">{phaseDescription}</p>
                                </div>
                            )}

                            {/* Submission note */}
                            {phaseNote && (
                                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                                        <FileText size={11} /> Employee's Phase {phase} Note
                                    </p>
                                    <p className="text-xs text-slate-700 leading-relaxed">{phaseNote}</p>
                                </div>
                            )}

                            {/* Repository link */}
                            {phaseRepoLink && (
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
                                    <GitBranch size={13} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-xs text-slate-500 font-semibold mr-1">Phase {phase} Repository:</span>
                                    <a
                                        href={phaseRepoLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-violet-600 hover:underline truncate"
                                    >
                                        <Link2 size={11} />
                                        {phaseRepoLink}
                                    </a>
                                </div>
                            )}

                            {/* Due date */}
                            {task.dueDate && (
                                <p className="text-xs text-slate-400">Due date: {task.dueDate}</p>
                            )}
                        </div>

                        {/* Inline reject form */}
                        {isRejecting && (
                            <div className="border-t border-amber-100 bg-amber-50 px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-amber-800">Request Revision for Phase {phase}</p>
                                    <button
                                        onClick={() => setRejectState({ taskId: null, feedback: "", loading: false })}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                                <textarea
                                    rows={3}
                                    placeholder="Explain what needs to be improved or corrected in this phase…"
                                    value={rejectState.feedback}
                                    onChange={(e) => setRejectState((s) => ({ ...s, feedback: e.target.value }))}
                                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 resize-none transition-all"
                                />
                                <div className="flex justify-end gap-2 mt-3">
                                    <button
                                        onClick={() => setRejectState({ taskId: null, feedback: "", loading: false })}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={rejectState.loading}
                                        className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
                                    >
                                        {rejectState.loading ? (
                                            <><Loader2 size={12} className="animate-spin" /> Sending…</>
                                        ) : (
                                            <><RotateCcw size={12} /> Send Phase {phase} for Revision</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
