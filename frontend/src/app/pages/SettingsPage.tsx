import { useState } from "react";
import {
  Building2,
  Upload,
  Clock,
  Globe,
  Plus,
  X,
  UserPlus,
  Mail,
  Bell,
  Shield,
  CheckSquare,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Search,
  ChevronDown,
  Save,
  Check,
  Users
} from "lucide-react";
import { usersData, User } from "../mockData";

const ROLES = ["System Admin", "Senior Manager", "Manager", "Reviewer", "Viewer"];
const TIMEZONES = ["UTC", "UTC-5 (EST)", "UTC-6 (CST)", "UTC-8 (PST)", "UTC+1 (CET)", "UTC+5:30 (IST)", "UTC+8 (SGT)", "UTC+9 (JST)"];

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
        }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (user: Partial<User>) => void }) {
  const [form, setForm] = useState<any>({ name: "", email: "", role: "Viewer", department: "" });
  const update = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "e.g. John Doe" },
            { label: "Email Address", key: "email", type: "email", placeholder: "john.doe@nexusflow.io" },
            { label: "Department", key: "department", type: "text", placeholder: "e.g. Engineering" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => update(key, e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400"
            >
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={() => { if (form.name && form.email) { onAdd(form); onClose(); } }}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: General ───────────────────────────────────────────────────────────

function GeneralSettings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: "NexusFlow IT Services",
    defaultSLA: 48,
    timezone: "UTC+5:30 (IST)",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Company Info */}
      <section>
        <h3 className="text-base font-semibold text-slate-800 mb-4">Company Information</h3>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <span className="text-xs font-bold">NF</span>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Upload size={14} />
                Upload Logo
              </button>
              <p className="text-xs text-slate-400">PNG, SVG or JPG · Max 2MB · 200×200px recommended</p>
            </div>
          </div>
        </div>
      </section>

      {/* SLA & Timezone */}
      <section>
        <h3 className="text-base font-semibold text-slate-800 mb-4">Platform Defaults</h3>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Default SLA Hours</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Clock size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={form.defaultSLA}
                  onChange={(e) => setForm({ ...form, defaultSLA: Number(e.target.value) })}
                  className="w-28 rounded-lg border border-slate-200 pl-9 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
              <span className="text-sm text-slate-500">hours per stage (applied to new workflows)</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform Timezone</label>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-3 text-slate-400" />
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 appearance-none cursor-pointer"
              >
                {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors ${saved ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
      >
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saved ? "Changes Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Tab 2: User Management ───────────────────────────────────────────────────

function UserManagement() {
  const [users, setUsers] = useState<User[]>(usersData);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = users.filter((u: User) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStatus(id: string) {
    setUsers((prev: User[]) => prev.map((u: User) => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));
  }

  function handleAdd(data: Partial<User>) {
    const newUser: User = {
      id: `U${Date.now()}`,
      name: data.name || "",
      email: data.email || "",
      role: data.role || "Viewer",
      department: data.department || "",
      status: "Active",
      joinedDate: new Date().toISOString().split("T")[0],
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=facearea&facepad=2`,
    };
    setUsers((prev: User[]) => [newUser, ...prev]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
        >
          <UserPlus size={14} />
          Add User
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["User", "Role", "Department", "Joined", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((user: User) => (
              <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover border border-slate-100" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <select
                    defaultValue={user.role}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-600">{user.department}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-500">{user.joinedDate}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${user.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${user.status === "Active"
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                    >
                      {user.status === "Active" ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                      {user.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                    <button className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <Pencil size={12} />
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <p className="text-xs text-slate-500">{users.filter((u: User) => u.status === "Active").length} active · {users.filter((u: User) => u.status === "Inactive").length} inactive · {users.length} total</p>
        </div>
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}

// ─── Tab 3: Permission Matrix ─────────────────────────────────────────────────

const PERMISSIONS = [
  { id: "p1", group: "Projects", label: "View Projects" },
  { id: "p2", group: "Projects", label: "Create Projects" },
  { id: "p3", group: "Projects", label: "Edit Projects" },
  { id: "p4", group: "Projects", label: "Approve / Reject" },
  { id: "p5", group: "Projects", label: "Delete Projects" },
  { id: "p6", group: "Workflows", label: "View Workflows" },
  { id: "p7", group: "Workflows", label: "Create / Edit Workflows" },
  { id: "p8", group: "Workflows", label: "Activate / Deactivate" },
  { id: "p9", group: "SLA", label: "View SLA Dashboard" },
  { id: "p10", group: "SLA", label: "Escalate Issues" },
  { id: "p11", group: "Reports", label: "View Reports" },
  { id: "p12", group: "Reports", label: "Export Reports" },
  { id: "p13", group: "Settings", label: "Manage Users" },
  { id: "p14", group: "Settings", label: "Edit Permissions" },
  { id: "p15", group: "Settings", label: "System Configuration" },
];

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  "System Admin": { p1: true, p2: true, p3: true, p4: true, p5: true, p6: true, p7: true, p8: true, p9: true, p10: true, p11: true, p12: true, p13: true, p14: true, p15: true },
  "Senior Manager": { p1: true, p2: true, p3: true, p4: true, p5: false, p6: true, p7: true, p8: true, p9: true, p10: true, p11: true, p12: true, p13: false, p14: false, p15: false },
  "Manager": { p1: true, p2: true, p3: true, p4: true, p5: false, p6: true, p7: false, p8: false, p9: true, p10: false, p11: true, p12: false, p13: false, p14: false, p15: false },
  "Reviewer": { p1: true, p2: false, p3: false, p4: true, p5: false, p6: true, p7: false, p8: false, p9: true, p10: false, p11: true, p12: false, p13: false, p14: false, p15: false },
  "Viewer": { p1: true, p2: false, p3: false, p4: false, p5: false, p6: true, p7: false, p8: false, p9: true, p10: false, p11: true, p12: false, p13: false, p14: false, p15: false },
};

function PermissionMatrix() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [saved, setSaved] = useState(false);
  const groups = [...new Set(PERMISSIONS.map((p) => p.group))];

  function toggle(role: string, permId: string) {
    if (role === "System Admin") return; // protect admin
    setMatrix((m: any) => ({
      ...m,
      [role]: { ...m[role], [permId]: !m[role][permId] },
    }));
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">Permission</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>{role.split(" ")[0]}</span>
                      {role.includes(" ") && <span>{role.split(" ").slice(1).join(" ")}</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <>
                  <tr key={`group-${group}`} className="bg-slate-50/80">
                    <td colSpan={ROLES.length + 1} className="px-4 py-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{group}</span>
                    </td>
                  </tr>
                  {PERMISSIONS.filter((p) => p.group === group).map((perm) => (
                    <tr key={perm.id} className="border-t border-slate-50 hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">{perm.label}</span>
                      </td>
                      {ROLES.map((role) => (
                        <td key={role} className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggle(role, perm.id)}
                            disabled={role === "System Admin"}
                            className={`mx-auto flex h-5 w-5 items-center justify-center rounded transition-colors ${matrix[role]?.[perm.id]
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                              } ${role === "System Admin" ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                          >
                            {matrix[role]?.[perm.id] && <Check size={11} />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors ${saved ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? "Permissions Saved!" : "Save Permissions"}
        </button>
        <p className="text-xs text-slate-400">System Admin permissions are locked and cannot be modified.</p>
      </div>
    </div>
  );
}

// ─── Tab 4: Notification Settings ────────────────────────────────────────────

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailApprovals: true,
    emailRejections: true,
    emailEscalations: true,
    emailSLABreach: true,
    emailWeekly: false,
    emailDaily: true,
    slackApprovals: false,
    slackEscalations: true,
    slackSLABreach: true,
    pushBrowser: false,
    escalationL1: true,
    escalationL2: true,
    escalationL3: true,
    digestTime: "09:00",
    escalationDelay: 24,
  });
  const [saved, setSaved] = useState(false);
  const toggle = (key: keyof typeof settings) =>
    setSettings((s: any) => ({ ...s, [key]: !s[key] }));

  const sections = [
    {
      title: "Email Notifications",
      icon: Mail,
      items: [
        { key: "emailApprovals", label: "Project Approvals", desc: "Receive email when a project you manage gets approved" },
        { key: "emailRejections", label: "Project Rejections", desc: "Receive email when a project is rejected with feedback" },
        { key: "emailEscalations", label: "Escalation Alerts", desc: "Immediate email on SLA escalations" },
        { key: "emailSLABreach", label: "SLA Breach Alerts", desc: "Email when any project breaches its SLA deadline" },
        { key: "emailDaily", label: "Daily Summary", desc: "Daily digest of all pending approvals and actions" },
        { key: "emailWeekly", label: "Weekly Report", desc: "Weekly performance and metrics summary" },
      ],
    },
    {
      title: "Slack Notifications",
      icon: Bell,
      items: [
        { key: "slackApprovals", label: "Approval Updates", desc: "Post approval/rejection events to connected Slack channel" },
        { key: "slackEscalations", label: "Escalation Alerts", desc: "Notify #escalations channel on L2+ breaches" },
        { key: "slackSLABreach", label: "SLA Breach Alerts", desc: "Notify #sla-alerts channel on any breach" },
      ],
    },
    {
      title: "Escalation Rules",
      icon: Shield,
      items: [
        { key: "escalationL1", label: "L1 Escalation (< 24h delay)", desc: "Notify assigned reviewer and direct manager" },
        { key: "escalationL2", label: "L2 Escalation (24–48h delay)", desc: "Notify department head and PMO" },
        { key: "escalationL3", label: "L3 Escalation (> 48h delay)", desc: "Notify C-level and trigger emergency review process" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {sections.map(({ title, icon: Icon, items }) => (
        <section key={title} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon size={15} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <ToggleSwitch
                  enabled={settings[key as keyof typeof settings] as boolean}
                  onToggle={() => toggle(key as keyof typeof settings)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Digest Settings */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Digest Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Daily Summary Time</label>
            <input
              type="time"
              value={settings.digestTime}
              onChange={(e) => setSettings({ ...settings, digestTime: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Escalation Grace Period (hrs)</label>
            <input
              type="number"
              min={1}
              value={settings.escalationDelay}
              onChange={(e) => setSettings({ ...settings, escalationDelay: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </section>

      <button
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
        className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors ${saved ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
      >
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saved ? "Settings Saved!" : "Save Notification Settings"}
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type TabKey = "general" | "users" | "permissions" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "general", label: "General", icon: Building2 },
    { key: "users", label: "User Management", icon: Users },
    { key: "permissions", label: "Permission Matrix", icon: Shield },
    { key: "notifications", label: "Notification Settings", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage platform configuration, users, roles, and notifications</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden -mb-6">
        {tabs.map(({ key, label, icon }) => (
          <TabButton key={key} active={activeTab === key} onClick={() => setActiveTab(key)} icon={icon} label={label} />
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-6">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "permissions" && <PermissionMatrix />}
        {activeTab === "notifications" && <NotificationSettings />}
      </div>
    </div>
  );
}
