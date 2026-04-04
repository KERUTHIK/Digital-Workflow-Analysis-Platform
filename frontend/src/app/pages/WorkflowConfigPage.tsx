import { useState, useRef, useEffect } from "react";
import * as Lucide from "lucide-react";
import { WorkflowTemplate, WorkflowStage } from "../mockData";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const {
  Plus, Trash2, GripVertical, Settings2, CheckCircle,
  ChevronRight, X, ToggleLeft, ToggleRight,
  Clock, Users, Layers, Save
} = Lucide as any;

const ROLES = [
  "Project Manager", "Technical Lead", "Finance Director", "Security Officer",
  "CTO / VP Engineering", "Department Head", "Legal Counsel", "Risk Manager",
  "CEO / COO", "Product Owner", "Compliance Officer", "CFO", "Procurement Manager",
];

function StageRow({
  stage,
  idx,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: {
  stage: WorkflowStage;
  idx: number;
  onUpdate: (id: string, field: keyof WorkflowStage, value: any) => void;
  onDelete: (id: string) => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: () => void;
  isDragging: boolean;
}) {
  return (
    <tr
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={onDrop}
      className={`border-b border-slate-100 transition-all ${isDragging ? "opacity-50 bg-indigo-50" : "hover:bg-slate-50"}`}
    >
      <td className="px-4 py-3 w-12">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {stage.order}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          value={stage.name}
          onChange={(e) => onUpdate(stage.id, "name", e.target.value)}
          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-slate-800 outline-none hover:border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-colors"
        />
      </td>
      <td className="px-4 py-3 min-w-[200px]">
        <select
          value={stage.role}
          onChange={(e) => onUpdate(stage.id, "role", e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
        >
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </td>
      <td className="px-4 py-3 w-36">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-slate-400 flex-shrink-0" />
          <input
            type="number"
            min={1}
            value={stage.slaHours}
            onChange={(e) => onUpdate(stage.id, "slaHours", Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 text-center"
          />
          <span className="text-xs text-slate-400">hrs</span>
        </div>
      </td>
      <td className="px-4 py-3 w-12">
        <button
          onClick={() => onDelete(stage.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

// ─── New Workflow Modal ──────────────────────────────────────────────────────

function NewWorkflowModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">New Workflow Template</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Workflow Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Hotfix Approval" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Describe when this workflow should be used..." className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={() => { if (name.trim()) onCreate(name, desc); }}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WorkflowConfigPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([] as WorkflowTemplate[]);
  const [selectedId, setSelectedId] = useState(null as string | null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const dragIdxRef = useRef(null as number | null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      setLoading(true);
      const data: any = await api.workflows.getAll();
      // Transform backend orderIndex to frontend order
      const transformed = data.map((t: any) => ({
        ...t,
        id: String(t.id),
        stages: (t.stages || []).map((s: any) => ({
          ...s,
          id: String(s.id),
          order: s.orderIndex
        }))
      }));
      setTemplates(transformed);
      if (transformed.length > 0 && !selectedId) {
        setSelectedId(transformed[0].id);
      }
    } catch (err) {
      console.error("Failed to load workflows:", err);
    } finally {
      setLoading(false);
    }
  }

  const selected = templates.find((t: WorkflowTemplate) => t.id === selectedId);
  const stages = selected?.stages ?? [];

  function updateTemplate(updater: (t: WorkflowTemplate) => WorkflowTemplate) {
    setTemplates((prev: WorkflowTemplate[]) => prev.map((t: WorkflowTemplate) => (t.id === selectedId ? updater(t) : t)));
    setSaved(false);
  }

  function handleUpdateStage(id: string, field: keyof WorkflowStage, value: any) {
    updateTemplate((t: WorkflowTemplate) => ({
      ...t,
      stages: t.stages.map((s: WorkflowStage) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  }

  function handleDeleteStage(id: string) {
    updateTemplate((t: WorkflowTemplate) => {
      const remaining = t.stages.filter((s: WorkflowStage) => s.id !== id).map((s: WorkflowStage, i: number) => ({ ...s, order: i + 1 }));
      return { ...t, stages: remaining };
    });
  }

  function handleAddStage() {
    updateTemplate((t: WorkflowTemplate) => ({
      ...t,
      stages: [
        ...t.stages,
        {
          id: `s${Date.now()}`,
          order: t.stages.length + 1,
          name: "New Stage",
          role: "Project Manager",
          slaHours: 24,
        },
      ],
    }));
  }

  function handleDragStart(idx: number) {
    dragIdxRef.current = idx;
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdxRef.current === null || dragIdxRef.current === idx) return;
    updateTemplate((t: WorkflowTemplate) => {
      const newStages = [...t.stages];
      const [dragged] = newStages.splice(dragIdxRef.current!, 1);
      newStages.splice(idx, 0, dragged);
      dragIdxRef.current = idx;
      return { ...t, stages: newStages.map((s: WorkflowStage, i: number) => ({ ...s, order: i + 1 })) };
    });
  }

  function handleDrop() {
    dragIdxRef.current = null;
  }

  function handleToggleStatus() {
    updateTemplate((t: WorkflowTemplate) => ({ ...t, status: t.status === "Active" ? "Inactive" : "Active" }));
  }

  async function handleDelete() {
    if (!selected || !selected.id) return;
    if (!window.confirm(`Are you sure you want to delete the workflow "${selected.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.workflows.delete(Number(selected.id));
      setSelectedId(null);
      loadWorkflows();
    } catch (err) {
      console.error("Failed to delete workflow:", err);
      alert("Failed to delete workflow. Please try again.");
    }
  }

  async function handleSave() {
    if (!selected) return;
    try {
      // Transform back to backend structure (order -> orderIndex)
      const payload = {
        ...selected,
        id: isNaN(Number(selected.id)) ? null : Number(selected.id),
        stages: selected.stages.map((s: any) => ({
          ...s,
          id: isNaN(Number(s.id)) ? null : Number(s.id),
          orderIndex: s.order
        }))
      };
      await api.workflows.save(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      loadWorkflows(); // Refresh list to get new IDs if any
    } catch (err) {
      console.error("Failed to save workflow:", err);
      alert("Failed to save changes. Please try again.");
    }
  }

  async function handleCreate(name: string, description: string) {
    const newTemplatePayload = {
      name,
      description,
      status: "Active" as const,
      projectCount: 0,
      createdBy: user?.name || "System",
      stages: [
        { id: null, orderIndex: 1, name: "Initial Request", role: "Project Manager", slaHours: 24 }
      ]
    };

    try {
      const saved = await api.workflows.save(newTemplatePayload);
      setShowNewModal(false);
      await loadWorkflows();
      if (saved && saved.id) {
        setSelectedId(String(saved.id));
      }
    } catch (err: any) {
      console.error("Failed to create workflow:", err);
      const msg = err.message || "Unknown error";
      const status = err.status ? ` (Status: ${err.status})` : "";
      alert(`Failed to create workflow${status}: ${msg}`);
    }
  }

  const totalSLA = stages.reduce((sum: number, s: WorkflowStage) => sum + s.slaHours, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-sm font-medium">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Configuration</h1>
          <p className="text-sm text-slate-500 mt-0.5">Design and manage approval workflow templates</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
        >
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Template List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">Templates ({templates.length})</h3>
          {templates.map((t: WorkflowTemplate) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${selectedId === t.id
                ? "border-indigo-200 bg-indigo-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedId === t.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Layers size={15} />
                  </div>
                  <span className={`text-xs font-mono ${selectedId === t.id ? "text-indigo-500" : "text-slate-400"}`}>{t.id}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${t.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {t.status}
                </span>
              </div>
              <p className={`text-sm font-semibold ${selectedId === t.id ? "text-indigo-900" : "text-slate-800"}`}>{t.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Layers size={11} /> {t.stages.length} stages</span>
                <span className="flex items-center gap-1"><CheckCircle size={11} /> {t.projectCount} projects</span>
              </div>
              {selectedId === t.id && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600">
                  <span>Editing</span>
                  <ChevronRight size={12} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Stage Editor */}
        {selected && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-slate-900">{selected.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selected.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {selected.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selected.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${selected.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {selected.status === "Active" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {selected.status}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${saved
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                >
                  {saved ? <CheckCircle size={14} /> : <Save size={14} />}
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 border-b border-slate-50 px-6 py-3 bg-slate-50/50">
              {([
                { label: "Total Stages", value: stages.length, icon: Layers },
                { label: "Total SLA Budget", value: `${totalSLA}h`, icon: Clock },
                { label: "Created By", value: selected.createdBy, icon: Users },
                { label: "Last Updated", value: selected.createdAt, icon: Settings2 },
              ] as any[]).map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-500">{label}:</span>
                  <span className="text-xs font-semibold text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            {/* DnD hint */}
            <div className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100/60">
              <GripVertical size={13} className="text-indigo-400" />
              <p className="text-xs text-indigo-600">Drag rows to reorder stages · Click cells to edit inline</p>
            </div>

            {/* Stage Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Responsible</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Hours</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage: WorkflowStage, idx: number) => (
                    <StageRow
                      key={stage.id}
                      stage={stage}
                      idx={idx}
                      onUpdate={handleUpdateStage}
                      onDelete={handleDeleteStage}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isDragging={dragIdxRef.current === idx}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Stage */}
            <div className="border-t border-slate-100 p-4">
              <button
                onClick={handleAddStage}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-colors"
              >
                <Plus size={16} />
                Add Stage
              </button>
            </div>

            {/* Workflow Preview */}
            <div className="border-t border-slate-100 px-6 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Workflow Preview</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {(stages as WorkflowStage[]).map((stage: WorkflowStage, idx: number) => (
                  <div key={stage.id} className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-9 min-w-[100px] items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 px-3">
                        <span className="text-xs font-semibold text-indigo-700 text-center leading-tight">{stage.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{stage.slaHours}h SLA</span>
                    </div>
                    {idx < stages.length - 1 && (
                      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                    )}
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1 ml-1 flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                  <span className="text-[10px] text-slate-400">Done</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewWorkflowModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
