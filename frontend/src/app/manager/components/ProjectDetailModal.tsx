import { useState, useEffect, useMemo } from "react";
import {
    X,
    Package,
    User,
    Calendar,
    CreditCard,
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import { api } from "../../services/api";

interface ProjectDetailModalProps {
    project: {
        id: string; // The PRJ-001 label
        _rawId: number;
        title: string;
        employeeName: string;
        budget: number;
        createdDate: string;
        progress: number;
    };
    onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectData, setProjectData] = useState<any>(null);
    const computedProgress = useMemo(() => {
        if (tasks.length === 0) return project.progress;

        const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
        return Math.round((completedTasks / tasks.length) * 100);
    }, [tasks, project.progress]);

    useEffect(() => {
        async function fetchDetails() {
            try {
                setLoading(true);
                // Fetch project metadata (to get description, client, etc)
                const pData = await api.employee.getProject(project._rawId);
                setProjectData(pData);

                // Fetch tasks
                const taskData = await api.manager.getProjectTasks(project._rawId);
                setTasks(Array.isArray(taskData) ? taskData : []);
            } catch (err) {
                console.error("Error fetching project details:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [project._rawId]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{project.title}</h2>
                            <p className="text-xs text-slate-500 font-medium">{project.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-50">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <User size={12} />
                                Client Name
                            </div>
                            <p className="text-sm font-medium text-slate-700">{projectData?.clientName || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <CreditCard size={12} />
                                Budget
                            </div>
                            <p className="text-sm font-medium text-slate-700">${project.budget.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <Calendar size={12} />
                                Created Date
                            </div>
                            <p className="text-sm font-medium text-slate-700">{project.createdDate}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <ClipboardList size={12} />
                                Overall Progress
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[100px]">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${computedProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-emerald-600">{computedProgress}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                            {projectData?.description || "No description provided for this project."}
                        </p>
                    </section>

                    {/* Task List */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Tasks</h3>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {tasks.length} Total
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-12 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <ClipboardList size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400">No tasks have been assigned yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                    task.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                        'bg-blue-100 text-blue-600'
                                                }`}>
                                                {task.status === 'COMPLETED' ? <CheckCircle2 size={14} /> :
                                                    task.status === 'REJECTED' ? <AlertCircle size={14} /> :
                                                        <Clock size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                                                    {task.title}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    Phase {task.currentPhase || 1} · Assigned to {task.assignedToName || 'Employee'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                task.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-50 text-blue-600'
                                            }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-md active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
