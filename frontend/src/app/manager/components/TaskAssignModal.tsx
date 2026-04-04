import { useState, useEffect } from "react";
import { X, User, CheckCircle, Loader2, CalendarDays, Pencil, ClipboardList, Lock, GitBranch, FileText } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface TaskForm {
    assignedToId: number;
    title: string;
    description: string;
    dueDate: string;
    phase1Description: string;
    phase2Description: string;
    phase3Description: string;
}

interface ExistingTask {
    id: number;
    assignedToId: number;
    assignedToName: string;
    title: string;
    description: string;
    dueDate: string;
    status: string;
    submittedNote: string | null;
    repositoryLink: string | null;
}

interface Props {
    project: { id: number; title: string; idLabel: string } | null;
    onClose: () => void;
}

export default function TaskAssignModal({ project, onClose }: Props) {
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [existingTasks, setExistingTasks] = useState<ExistingTask[]>([]);
    const [forms, setForms] = useState<Record<number, TaskForm>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!project) return;
        loadData();
    }, [project]);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [members, tasks] = await Promise.all([
                api.manager.getTeam<TeamMember[]>(),
                api.manager.getProjectTasks<ExistingTask[]>(project!.id),
            ]);

            // Filter out the manager from the list of assignable employees
            const memberList = (Array.isArray(members) ? members : []).filter(m => String(m.id) !== String(user?.id));
            const taskList = Array.isArray(tasks) ? tasks : [];

            setTeamMembers(memberList);
            setExistingTasks(taskList);

            // Pre-fill forms with existing task data
            const initialForms: Record<number, TaskForm> = {};
            memberList.forEach((m) => {
                const existing = taskList.find((t) => t.assignedToId === m.id) as any;
                initialForms[m.id] = {
                    assignedToId: m.id,
                    title: existing?.title ?? "",
                    description: existing?.description ?? "",
                    dueDate: existing?.dueDate ?? "",
                    phase1Description: existing?.phase1Description ?? "",
                    phase2Description: existing?.phase2Description ?? "",
                    phase3Description: existing?.phase3Description ?? "",
                };
            });
            setForms(initialForms);
        } catch (err: any) {
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function updateForm(memberId: number, field: keyof TaskForm, value: string) {
        setForms((prev) => ({
            ...prev,
            [memberId]: { ...prev[memberId], [field]: value },
        }));
    }

    async function handleSave() {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const payload = Object.values(forms).filter((f) => f.title.trim() !== "");
            await api.manager.assignTasks(project!.id, payload);
            setSaved(true);
            // Reload to get fresh data
            await loadData();
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setError(err.message || "Failed to save tasks.");
        } finally {
            setSaving(false);
        }
    }

    if (!project) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ClipboardList size={18} className="text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Assign Tasks</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">{project.title}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{project.idLabel} · Assign specific work to each team member</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ml-4 flex-shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 size={28} className="text-indigo-500 animate-spin" />
                            <p className="text-sm text-slate-400">Loading team members…</p>
                        </div>
                    ) : teamMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                            <User size={32} className="opacity-40" />
                            <p className="text-sm">No team members found. Add members to the team first.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {teamMembers.map((member) => {
                                const form = forms[member.id] ?? { assignedToId: member.id, title: "", description: "", dueDate: "" };
                                const existing = existingTasks.find((t) => t.assignedToId === member.id);
                                return (
                                    <div
                                        key={member.id}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-indigo-200 transition-colors"
                                    >
                                        {/* Member header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=40`}
                                                alt={member.name}
                                                className="h-9 w-9 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                                                <p className="text-xs text-slate-400">{member.email}</p>
                                            </div>
                                            {existing && (
                                                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${existing.status === "COMPLETED"
                                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                    : existing.status === "UNDER_REVIEW"
                                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                        : existing.status === "REJECTED"
                                                            ? "bg-red-100 text-red-700 border border-red-200"
                                                            : "bg-amber-100 text-amber-700 border border-amber-200"
                                                    }`}>
                                                    {existing.status === "COMPLETED" ? "✓ Completed"
                                                        : existing.status === "UNDER_REVIEW" ? "Under Review"
                                                            : existing.status === "REJECTED" ? "Revision Requested"
                                                                : "Pending"}
                                                </span>
                                            )}
                                        </div>

                                        {/* COMPLETED — locked read-only card */}
                                        {existing?.status === "COMPLETED" ? (
                                            <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                                                    <Lock size={11} /> Task locked — approved by manager
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Task</p>
                                                    <p className="text-sm font-semibold text-slate-800">{existing.title}</p>
                                                    {existing.description && (
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{existing.description}</p>
                                                    )}
                                                </div>
                                                {existing.submittedNote && (
                                                    <div className="rounded-lg bg-white border border-emerald-100 px-3 py-2">
                                                        <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 mb-0.5"><FileText size={10} /> Submitted note</p>
                                                        <p className="text-xs text-slate-700">{existing.submittedNote}</p>
                                                    </div>
                                                )}
                                                {existing.repositoryLink && (
                                                    <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-100 px-3 py-1.5">
                                                        <GitBranch size={12} className="text-slate-400 flex-shrink-0" />
                                                        <a href={existing.repositoryLink} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-violet-600 hover:underline truncate">
                                                            {existing.repositoryLink}
                                                        </a>
                                                    </div>
                                                )}
                                                {existing.dueDate && (
                                                    <p className="text-[11px] text-slate-400">Due date: {existing.dueDate}</p>
                                                )}
                                            </div>
                                        ) : (
                                            /* Editable task form */
                                            <div className="space-y-2.5">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                        Task Title <span className="text-slate-300">(leave blank to not assign)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Build Login Module, Write API Documentation…"
                                                        value={form.title}
                                                        onChange={(e) => updateForm(member.id, "title", e.target.value)}
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Overall task description…"
                                                        value={form.description}
                                                        onChange={(e) => updateForm(member.id, "description", e.target.value)}
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all resize-none"
                                                    />
                                                </div>
                                                {/* Phase descriptions */}
                                                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-2">
                                                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">Phase Deliverables</p>
                                                    {[
                                                        { key: "phase1Description" as keyof TaskForm, label: "Phase 1 — Planning", placeholder: "What should the employee deliver in phase 1?" },
                                                        { key: "phase2Description" as keyof TaskForm, label: "Phase 2 — Development", placeholder: "What should the employee build or implement in phase 2?" },
                                                        { key: "phase3Description" as keyof TaskForm, label: "Phase 3 — Delivery", placeholder: "What is the final deliverable in phase 3?" },
                                                    ].map(({ key, label, placeholder }) => (
                                                        <div key={key}>
                                                            <label className="block text-[11px] font-semibold text-indigo-700 mb-0.5">{label}</label>
                                                            <textarea
                                                                rows={2}
                                                                placeholder={placeholder}
                                                                value={(form[key] as string) ?? ""}
                                                                onChange={(e) => updateForm(member.id, key, e.target.value)}
                                                                className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all resize-none"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                                        <CalendarDays size={11} /> Due Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={form.dueDate}
                                                        onChange={(e) => updateForm(member.id, "dueDate", e.target.value)}
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <div className="flex-1">
                        {error && <p className="text-xs text-red-600">{error}</p>}
                        {saved && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                <CheckCircle size={13} />
                                Tasks saved successfully!
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading || teamMembers.length === 0}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {saving ? (
                                <><Loader2 size={14} className="animate-spin" /> Saving…</>
                            ) : (
                                <><Pencil size={14} /> Save Tasks</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
