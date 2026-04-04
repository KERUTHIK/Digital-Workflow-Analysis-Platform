import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  X,
  Search,
  Crown,
  Mail,
  Lock,
  EyeOff,
  Eye,
  Building2,
  Users,
  Check,
  AlertCircle,
  ShieldCheck,
  UserCog,
  Calendar,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { usersData, teamsData, Team } from "../mockData";
import { api } from "../services/api";

interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  avatar: string;
  skills: string;
  joinedDate: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6"];
const DEPARTMENTS = ["Engineering", "DevOps", "Security", "Product", "Finance", "Legal", "Marketing", "HR", "Sales", "IT Ops", "Operations"];
const ROLES = ["Manager", "Employee", "Reviewer", "Viewer", "System Admin"];



// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AvatarFallback({ name, size = 32, color = "#6366f1" }: { name: string; size?: number; color?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.34, fontWeight: 700 }}
    >
      {getInitials(name)}
    </div>
  );
}

function UserAvatar({ user, size = 32 }: { user: AppUser; size?: number }) {
  const [err, setErr] = useState(false);
  if (err || !user.avatar) return <AvatarFallback name={user.name} size={size} />;
  return (
    <img
      src={user.avatar}
      alt={user.name}
      onError={() => setErr(true)}
      className="rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}

// ─── Create / Edit Team Modal ─────────────────────────────────────────────────

function TeamModal({
  initial,
  allUsers,
  onSave,
  onClose,
}: {
  initial?: Team;
  allUsers: AppUser[];
  onSave: (team: Omit<Team, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [dept, setDept] = useState<string>(initial?.department ?? DEPARTMENTS[0]);
  const [desc, setDesc] = useState<string>(initial?.description ?? "");
  const [color, setColor] = useState<string>(initial?.color ?? TEAM_COLORS[0]);
  const [managerId, setManagerId] = useState<string>(initial?.managerId ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(initial?.memberIds ?? []);
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const managers = allUsers.filter((u: AppUser) => ["Manager", "System Admin", "Senior Manager"].includes(u.role) && u.status === "Active");
  const filteredUsers = allUsers.filter(
    (u: AppUser) => u.status === "Active" &&
      (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  function toggleMember(id: string) {
    setMemberIds((prev: string[]) => prev.includes(id) ? prev.filter((m: string) => m !== id) : [...prev, id]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Team name is required.";
    if (!managerId) e.managerId = "Please assign a manager.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const ids = [...new Set([managerId, ...memberIds])];
    onSave({ name: name.trim(), department: dept, description: desc, color, managerId, memberIds: ids });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">{isEdit ? "Edit Team" : "Create New Team"}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? "Update team details and membership" : "Set up a new team with a manager and members"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend Development"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 ${errors.name ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Department + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400">
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Color</label>
              <div className="flex items-center gap-2 mt-1">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="What does this team do?"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Manager */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Manager <span className="text-red-500">*</span></label>
            <select
              value={managerId}
              onChange={(e) => {
                setManagerId(e.target.value);
                if (!memberIds.includes(e.target.value)) setMemberIds((prev: string[]) => [e.target.value, ...prev.filter((id) => id !== managerId)]);
              }}
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 ${errors.managerId ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}
            >
              <option value="">— Select a manager —</option>
              {managers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
            {errors.managerId && <p className="text-xs text-red-500 mt-1">{errors.managerId}</p>}
            {managerId && (() => {
              const mgr = allUsers.find((u) => u.id === managerId);
              return mgr ? (
                <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded-lg">
                  <UserAvatar user={mgr} size={28} />
                  <div>
                    <p className="text-xs font-semibold text-indigo-900">{mgr.name}</p>
                    <p className="text-[10px] text-indigo-500">{mgr.email}</p>
                  </div>
                  <ShieldCheck size={14} className="text-indigo-500 ml-auto" />
                </div>
              ) : null;
            })()}
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Team Members <span className="text-slate-400 font-normal">({memberIds.length} selected)</span>
            </label>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search users to add…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-50">
              {filteredUsers.map((u) => {
                const checked = memberIds.includes(u.id);
                const isMgr = u.id === managerId;
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? "bg-indigo-50/60" : "hover:bg-slate-50"} ${isMgr ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isMgr}
                      onChange={() => !isMgr && toggleMember(u.id as string)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
                    />
                    <UserAvatar user={u} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.name} {isMgr && <span className="text-[10px] text-indigo-500 ml-1">(Manager)</span>}</p>
                      <p className="text-xs text-slate-400 truncate">{u.role} · {u.department}</p>
                    </div>
                    {checked && !isMgr && <Check size={13} className="text-indigo-600 flex-shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <CheckCircle2 size={15} />
            {isEdit ? "Save Changes" : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create New User Modal ────────────────────────────────────────────────────

function CreateUserModal({
  teams,
  onSave,
  onClose,
}: {
  teams: Team[];
  onSave: (user: AppUser) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "Employee", department: DEPARTMENTS[0], teamId: "", skills: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const up = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCreate() {
    if (!validate()) return;
    const newUser: AppUser = {
      id: `U${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      department: form.department,
      status: "Active",
      avatar: "",
      skills: form.skills,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    onSave(newUser);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); }, 1800);
  }

  const pwdStrength = (() => {
    const p = form.password;
    if (!p) return { label: "", color: "", width: 0 };
    if (p.length < 6) return { label: "Weak", color: "bg-red-400", width: 25 };
    if (p.length < 10) return { label: "Fair", color: "bg-amber-400", width: 55 };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) return { label: "Strong", color: "bg-emerald-500", width: 100 };
    return { label: "Good", color: "bg-blue-400", width: 80 };
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <UserPlus size={17} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create New User</h3>
              <p className="text-xs text-slate-400">Manager or Employee with credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-base font-bold text-slate-900">User Created!</p>
              <p className="text-sm text-slate-500 mt-1">{form.name} has been added to the system.</p>
            </div>
          ) : (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => up("name", e.target.value)} placeholder="e.g. John Doe"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 ${errors.name ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} placeholder="john.doe@nexusflow.io"
                    className={`w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 ${errors.email ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => up("password", e.target.value)} placeholder="Min. 6 characters"
                    className={`w-full rounded-lg border pl-9 pr-10 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 ${errors.password ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all ${pwdStrength.color}`} style={{ width: `${pwdStrength.width}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold ${pwdStrength.color.replace("bg-", "text-")}`}>{pwdStrength.label}</span>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => up("confirmPassword", e.target.value)} placeholder="Re-enter password"
                    className={`w-full rounded-lg border pl-9 pr-10 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 ${errors.confirmPassword ? "border-red-400 bg-red-50" : form.confirmPassword && form.password === form.confirmPassword ? "border-emerald-400 bg-emerald-50/30" : "border-slate-200 focus:border-indigo-400"}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <CheckCircle2 size={15} className="absolute right-9 top-3 text-emerald-500" />
                  )}
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Role + Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => up("role", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400">
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                </div>
              </div>

              {/* Assign to Team */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign to Team <span className="text-slate-400 font-normal">(optional)</span></label>
                <select value={form.teamId} onChange={(e) => up("teamId", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400">
                  <option value="">— No team assignment —</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Key Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Key Skills <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input value={form.skills} onChange={(e) => up("skills", e.target.value)} placeholder="e.g. React, Node.js, Agile"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
              </div>

              {/* Role hint */}
              <div className={`flex items-start gap-2 rounded-lg p-3 text-xs ${form.role === "Manager" ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-500"}`}>
                {form.role === "Manager" ? <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                <span>
                  {form.role === "Manager"
                    ? "This user will be available as a team manager and can approve project requests."
                    : "This user will be added as a team member and can participate in assigned projects."}
                </span>
              </div>
            </>
          )}
        </div>

        {
          !success && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button onClick={onClose} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                <UserPlus size={15} />
                Create User
              </button>
            </div>
          )
        }
      </div >
    </div >
  );
}

// ─── Team Detail Modal (centered) ─────────────────────────────────────────────

function TeamDetailPanel({
  team,
  allUsers,
  onClose,
  onEdit,
  onDelete,
}: {
  team: Team;
  allUsers: AppUser[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const manager = allUsers.find((u) => u.id === team.managerId);
  const uniqueMemberIds = [...new Set(team.memberIds)];
  const members = uniqueMemberIds.map((id) => allUsers.find((u) => u.id === id)).filter(Boolean) as AppUser[];
  const nonManagers = members.filter((m) => m.id !== team.managerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl max-h-[90vh]">

        {/* Color Banner */}
        <div className="relative h-24 flex-shrink-0" style={{ backgroundColor: team.color }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 70%)" }} />
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm">
            <X size={16} />
          </button>
          <div className="absolute bottom-4 left-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Users size={22} className="text-white" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{team.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">{team.department}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar size={11} /> Since {team.createdAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={onEdit} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={onDelete} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
          {team.description && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{team.description}</p>}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-b border-slate-100 divide-x divide-slate-100">
          {[
            { label: "Total Members", value: members.length },
            { label: "Employees", value: nonManagers.length },
            { label: "Manager", value: 1 },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center justify-center py-3 px-2">
              <span className="text-xl font-bold text-slate-900">{value}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Manager */}
          {manager && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Manager</p>
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4">
                <UserAvatar user={manager} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{manager.name}</p>
                    <Crown size={13} className="text-amber-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-indigo-600 font-medium">{manager.role}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{manager.email}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                  {manager.status}
                </span>
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Team Members ({nonManagers.length})
            </p>
            {nonManagers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <Users size={24} className="mb-1.5 opacity-30" />
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nonManagers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition-colors">
                    <UserAvatar user={member} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-600">{member.role}</span>
                      <span className="text-[10px] text-slate-400">{member.department}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  allUsers,
  onView,
  onEdit,
  onDelete,
}: {
  team: Team;
  allUsers: AppUser[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const manager = allUsers.find((u) => u.id === team.managerId);
  const members = team.memberIds.map((id) => allUsers.find((u) => u.id === id)).filter(Boolean) as AppUser[];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer" onClick={onView}>
      <div className="h-1.5 w-full" style={{ backgroundColor: team.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white flex-shrink-0" style={{ backgroundColor: team.color }}>
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{team.name}</h3>
              <span className="text-xs text-slate-400">{team.department}</span>
            </div>
          </div>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button onClick={() => { onView(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <Eye size={13} /> View Details
                </button>
                <button onClick={() => { onEdit(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <Edit2 size={13} /> Edit Team
                </button>
                <div className="my-1 h-px bg-slate-100" />
                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                  <Trash2 size={13} /> Delete Team
                </button>
              </div>
            )}
          </div>
        </div>

        {team.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{team.description}</p>
        )}

        {manager && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 mb-4">
            <UserAvatar user={manager} size={24} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{manager.name}</p>
              <p className="text-[10px] text-slate-400">Manager</p>
            </div>
            <Crown size={12} className="text-amber-500 flex-shrink-0" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {members.slice(0, 5).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }} className="relative">
                <UserAvatar user={m} size={28} />
              </div>
            ))}
            {members.length > 5 && (
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 border-2 border-white text-[10px] font-bold text-slate-600" style={{ marginLeft: -8 }}>
                +{members.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{members.length}</span> member{members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [allUsers, setAllUsers] = React.useState<AppUser[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState<boolean>(false);
  const [showCreateUser, setShowCreateUser] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [statusToast, setStatusToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setStatusToast({ msg, type });
    setTimeout(() => setStatusToast(null), 3000);
  }

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const data = await api.teams.getAll();
      setTeams(data.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        department: t.department,
        color: t.color || "#6366f1",
        description: t.description || "",
        managerId: t.managerId ? String(t.managerId) : "",
        memberIds: (t.memberIds || []).map(String),
        createdAt: t.createdAt ? t.createdAt.split("T")[0] : "2024-01-01"
      })));
    } catch (err) {
      console.error("Failed to fetch teams", err);
    }
  }

  async function fetchUsers() {
    try {
      const data = await api.admin.getUsers();
      setAllUsers(data.map((u: any) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role === "ADMIN" ? "System Admin" : u.role.charAt(0) + u.role.slice(1).toLowerCase(),
        department: u.department || "Engineering",
        status: u.active ? "Active" : "Inactive",
        avatar: "",
        skills: u.skills || "",
        joinedDate: u.createdAt ? u.createdAt.split("T")[0] : "2024-01-01"
      })));
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }

  const filteredTeams = useMemo(() =>
    teams.filter((t: Team) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase())
    ), [teams, search]);

  async function handleCreateTeam(data: any) {
    try {
      const payload = {
        name: data.name,
        department: data.department,
        color: data.color,
        description: data.description,
        managerId: Number(data.managerId),
        memberIds: data.memberIds.map(Number)
      };
      await api.teams.create(payload);
      setShowCreateTeam(false);
      showToast(`Team "${data.name}" created successfully.`);
      fetchTeams();
    } catch (err: any) {
      showToast(err.message || "Failed to create team", "error");
    }
  }

  async function handleEditTeam(data: any) {
    if (!editingTeam) return;
    try {
      const payload = {
        name: data.name,
        department: data.department,
        color: data.color,
        description: data.description,
        managerId: Number(data.managerId),
        memberIds: data.memberIds.map(Number)
      };
      await api.teams.update(Number(editingTeam.id), payload);
      setEditingTeam(null);
      showToast(`Team "${data.name}" updated.`);
      fetchTeams();
    } catch (err: any) {
      showToast(err.message || "Failed to update team", "error");
    }
  }

  async function handleDeleteTeam(id: string) {
    try {
      await api.teams.delete(Number(id));
      if (selectedTeam?.id === id) setSelectedTeam(null);
      showToast(`Team deleted.`, "error");
      fetchTeams();
    } catch (err: any) {
      showToast(err.message || "Failed to delete team", "error");
    }
  }

  async function handleCreateUser(user: any) {
    try {
      // Map frontend roles to backend enum
      const roleMap: Record<string, string> = {
        "Manager": "MANAGER",
        "Employee": "EMPLOYEE",
        "Reviewer": "REVIEWER",
        "Viewer": "VIEWER",
        "System Admin": "ADMIN"
      };

      const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        role: roleMap[user.role] || "EMPLOYEE",
        department: user.department,
        skills: user.skills
      };

      await api.admin.createUser(payload);
      showToast(`User "${user.name}" created with role ${user.role}.`);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to create user", "error");
    }
  }

  const totalMembers = useMemo(() => new Set(teams.flatMap((t: Team) => t.memberIds)).size, [teams]);
  const totalManagers = useMemo(() => new Set(teams.map((t: Team) => t.managerId)).size, [teams]);
  const totalEmployees = allUsers.filter((u: AppUser) => u.status === "Active").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {statusToast && (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg text-white text-sm font-medium ${statusToast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {statusToast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {statusToast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage teams, assign managers and members</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <UserPlus size={15} /> New User
          </button>
          <button onClick={() => setShowCreateTeam(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors">
            <Plus size={15} /> Create Team
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Teams", value: teams.length, icon: Building2, color: "bg-indigo-50 text-indigo-600", sub: `${filteredTeams.length} visible` },
          { label: "Total Members", value: totalMembers, icon: Users, color: "bg-blue-50 text-blue-600", sub: "Unique across teams" },
          { label: "Managers", value: totalManagers, icon: Crown, color: "bg-amber-50 text-amber-600", sub: "Team leads assigned" },
          { label: "Active Users", value: totalEmployees, icon: UserCog, color: "bg-emerald-50 text-emerald-600", sub: "In the system" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name or department…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 shadow-sm"
          />
        </div>
        <p className="text-sm text-slate-400">{filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
          <Users size={36} className="mb-3 text-slate-300" />
          <p className="text-base font-medium text-slate-500">No teams found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or create a new team</p>
          <button onClick={() => setShowCreateTeam(true)} className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <Plus size={14} /> Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTeams.map((team: Team) => (
            <TeamCard
              key={team.id}
              team={team}
              allUsers={allUsers}
              onView={() => setSelectedTeam(team)}
              onEdit={() => setEditingTeam(team)}
              onDelete={() => handleDeleteTeam(team.id)}
            />
          ))}
          <button
            onClick={() => setShowCreateTeam(true)}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 py-10 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 mb-2"><Plus size={18} /></div>
            <p className="text-sm font-medium">New Team</p>
          </button>
        </div>
      )}

      {/* All Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">All Users ({allUsers.length})</h3>
            <p className="text-xs text-slate-400 mt-0.5">Managers and employees available for team assignment</p>
          </div>
          <button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <UserPlus size={13} /> Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50">
                {["User", "Role", "Department", "Team(s)", "Status", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allUsers.map((user: AppUser) => {
                const userTeams = teams.filter((t: Team) => t.memberIds.includes(user.id));
                const isMgr = teams.some((t: Team) => t.managerId === user.id);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size={34} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                            {isMgr && <Crown size={11} className="text-amber-500" />}
                          </div>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${user.role === "System Admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        user.role === "Manager" || user.role === "Senior Manager" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-sm text-slate-600">{user.department}</span></td>
                    <td className="px-4 py-3.5">
                      {userTeams.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userTeams.slice(0, 2).map((t: Team) => (
                            <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: t.color }}>
                              {t.name.split(" ")[0]}
                            </span>
                          ))}
                          {userTeams.length > 2 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">+{userTeams.length - 2}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${user.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-sm text-slate-500">{user.joinedDate}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedTeam && (
        <TeamDetailPanel
          team={selectedTeam}
          allUsers={allUsers}
          onClose={() => setSelectedTeam(null)}
          onEdit={() => { setEditingTeam(selectedTeam); setSelectedTeam(null); }}
          onDelete={() => { handleDeleteTeam(selectedTeam.id); setSelectedTeam(null); }}
        />
      )}
      {showCreateTeam && (
        <TeamModal allUsers={allUsers} onSave={handleCreateTeam} onClose={() => setShowCreateTeam(false)} />
      )}
      {editingTeam && (
        <TeamModal initial={editingTeam} allUsers={allUsers} onSave={handleEditTeam} onClose={() => setEditingTeam(null)} />
      )}
      {showCreateUser && (
        <CreateUserModal teams={teams} onSave={handleCreateUser} onClose={() => setShowCreateUser(false)} />
      )}
    </div>
  );
}
