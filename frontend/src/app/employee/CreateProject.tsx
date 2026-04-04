import { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  Users,
  Paperclip,
  Send,
  CheckCircle,
  X,
  Info,
  ChevronRight,
  Loader2
} from "lucide-react";
import { api } from "../services/api";

interface FormData {
  projectId: string;
  title: string;
  client: string;
  budget: string;
  timeline: string;
  riskCategory: "Low" | "Medium" | "High";
  description: string;
  resourceRequirement: string;
  priority: "Low" | "Medium" | "High";
  department: string;
  teamId: string;
  progress: number;
}

interface FormErrors {
  projectId?: string;
  title?: string;
  client?: string;
  budget?: string;
  timeline?: string;
  description?: string;
  resourceRequirement?: string;
}

const INITIAL: FormData = {
  projectId: "",
  title: "",
  client: "",
  budget: "",
  timeline: "",
  riskCategory: "Low",
  description: "",
  resourceRequirement: "",
  priority: "Medium",
  department: "General",
  teamId: "",
  progress: 0,
};

const RISK_INFO = {
  Low: "Minimal impact if delayed. Standard track.",
  Medium: "Moderate scope/cost risk. Enhanced review.",
  High: "High budget or strategic risk. Board review.",
};

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode; }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><X size={11} /> {error}</p>}
      {hint && !error && <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400"><Info size={10} /> {hint}</p>}
    </div>
  );
}

export default function CreateProjectPage() {
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  useEffect(() => { fetchAvailableProjects(); }, []);

  async function fetchAvailableProjects() {
    try {
      const res = await api.employee.getMyProjects({ size: 100 });
      // Filter projects that aren't completed (progress < 100)
      const projects = (res.content || []).filter((p: any) => (p.progress || 0) < 100);
      setAvailableProjects(projects);
    } catch (err) { console.error("Failed to fetch available projects", err); }
  }

  function handleProjectSelect(pid: string) {
    const selected = availableProjects.find((p) => p.id.toString() === pid);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        projectId: pid,
        title: selected.title || "",
        client: selected.clientName || "",
        budget: selected.budget ? selected.budget.toString() : "",
        department: selected.department || "General",
        description: selected.description || "",
        teamId: selected.teamId ? selected.teamId.toString() : "",
        progress: selected.progress || 0,
      }));
      setErrors((prev) => ({ ...prev, projectId: undefined }));
    } else { setForm((prev) => ({ ...prev, projectId: "" })); }
  }

  function update(field: keyof FormData, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.projectId) errs.projectId = "Please select a project to update";
    if (!form.title.trim()) errs.title = "Project title is required";
    if (!form.client.trim()) errs.client = "Client name is required";
    if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) <= 0) errs.budget = "Valid budget is required";
    if (!form.timeline) errs.timeline = "Select a timeline";
    if (!form.description.trim() || form.description.trim().length < 30) errs.description = "Detailed description required (min 30 chars)";
    if (!form.resourceRequirement.trim()) errs.resourceRequirement = "Specify resource requirements";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.projectId || errs.title || errs.client || errs.budget || errs.timeline) setStep(1);
      else if (errs.description) setStep(2);
      else setStep(3);
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.employee.updateProject(Number(form.projectId), {
        title: form.title,
        clientName: form.client,
        budget: Number(form.budget),
        description: form.description + `\n\nRisk: ${form.riskCategory}\nResources: ${form.resourceRequirement}\nTimeline: ${form.timeline}`,
        teamId: form.teamId ? Number(form.teamId) : null,
        progress: form.progress
      });
      setSubmitted(true);
    } catch (err: any) { alert(err.message || "Update failed"); }
    finally { setLoading(false); }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-800">Project Updated!</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            The details for <span className="font-semibold text-slate-700">{form.title}</span> have been updated.
            Progress is currently at <span className="font-bold text-violet-600">{form.progress}%</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setForm(INITIAL); setSubmitted(false); setStep(1); }} className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
            Update Another
          </button>
          <a href="/employee/projects" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm">
            View My Projects
          </a>
        </div>
      </div>
    );
  }

  const inputClass = (err?: string) => `w-full rounded-xl border ${err ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-slate-50"} px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 ${err ? "focus:border-red-400 focus:ring-red-400/10" : "focus:border-violet-400 focus:ring-violet-400/10"}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Update Project</h1>
        <p className="text-sm text-slate-500 mt-0.5">Edit details and update progress for your active projects</p>
      </div>

      <div className="flex items-center gap-0">
        {[{ n: 1, label: "Basic Info" }, { n: 2, label: "Details & Risk" }, { n: 3, label: "Resources & Progress" }].map((s, i, arr) => (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => step > s.n && setStep(s.n)}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${step >= s.n ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {step > s.n ? <CheckCircle size={14} /> : s.n}
              </div>
              <p className={`text-[10px] font-medium mt-1 whitespace-nowrap ${step >= s.n ? "text-violet-700" : "text-slate-400"}`}>{s.label}</p>
            </div>
            {i < arr.length - 1 && <div className={`mx-3 mb-4 h-0.5 w-16 transition-all ${step > s.n ? "bg-violet-400" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {step === 1 && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText size={16} className="text-violet-500" />
                <h2 className="text-sm font-semibold text-slate-800">Project Selection & Info</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Select Project" required error={errors.projectId}>
                  <select value={form.projectId} onChange={(e) => handleProjectSelect(e.target.value)} className={inputClass(errors.projectId)}>
                    <option value="">— Select a project —</option>
                    {availableProjects.map((p) => <option key={p.id} value={p.id}>[PRJ-{p.id.toString().padStart(3, "0")}] {p.title}</option>)}
                  </select>
                </Field>
                <Field label="Project Title" required error={errors.title}>
                  <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass(errors.title)} />
                </Field>
                <Field label="Client" required error={errors.client}>
                  <input type="text" value={form.client} onChange={(e) => update("client", e.target.value)} className={inputClass(errors.client)} />
                </Field>
                <Field label="Budget (USD)" required error={errors.budget}>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input type="number" value={form.budget} onChange={(e) => update("budget", e.target.value)} className={`${inputClass(errors.budget)} pl-8`} />
                  </div>
                </Field>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => { if (!form.projectId) setErrors({ projectId: "Required" }); else setStep(2); }} className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm">
                  Continue <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <AlertTriangle size={16} className="text-violet-500" />
                <h2 className="text-sm font-semibold text-slate-800">Description & Risk</h2>
              </div>
              <Field label="Description" required error={errors.description}>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} className={`${inputClass(errors.description)} resize-none`} />
              </Field>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Risk Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Low", "Medium", "High"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => update("riskCategory", r)} className={`rounded-xl border-2 p-3 text-left transition-all ${form.riskCategory === r ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}>
                      <span className="text-xs font-bold block">{r} Risk</span>
                      <p className="text-[10px] text-slate-400 mt-1">{RISK_INFO[r]}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-semibold text-slate-600">Back</button>
                <button type="button" onClick={() => setStep(3)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">Continue <ChevronRight size={15} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Users size={16} className="text-violet-500" />
                <h2 className="text-sm font-semibold text-slate-800">Resources & Progress</h2>
              </div>
              <Field label="Resource Requirements" required error={errors.resourceRequirement}>
                <textarea value={form.resourceRequirement} onChange={(e) => update("resourceRequirement", e.target.value)} rows={3} className={inputClass(errors.resourceRequirement)} />
              </Field>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Project Progress</label>
                  <span className="text-xs font-bold text-violet-600">{form.progress}%</span>
                </div>
                <input type="range" min="0" max="100" value={form.progress} onChange={(e) => update("progress", parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                <p className="text-[10px] text-slate-400 mt-2">Update the current completion percentage as work progresses.</p>
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(2)} className="px-5 py-2.5 text-sm font-semibold text-slate-600">Back</button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Save Project Updates
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
