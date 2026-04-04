import { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Check,
  X,
  Eye,
  EyeOff,
  Save,
  Camera,
  Mail,
  Phone,
  Building2,
  MapPin,
  Shield,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Tab = "profile" | "password" | "notifications";

const NOTIF_DEFAULTS = {
  emailApprovals: true,
  emailRejections: true,
  emailComments: true,
  emailSLA: true,
  pushApprovals: false,
  pushRejections: true,
  pushComments: false,
  pushSLA: true,
  weeklyDigest: true,
  projectUpdates: true,
};

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${active
        ? "bg-violet-50 text-violet-700 border border-violet-100"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
    >
      <Icon size={16} className={active ? "text-violet-600" : "text-slate-400"} />
      {label}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: any;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-xl border border-slate-200 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 ${Icon ? "pl-9 pr-4" : "px-4"
            } ${disabled
              ? "bg-slate-50 text-slate-400 cursor-not-allowed"
              : "bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
            }`}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-violet-600" : "bg-slate-200"
          }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}

export default function EmployeeSettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "+1 (555) 204-7891",
    location: "San Francisco, CA",
    department: user?.department ?? "DevOps",
    bio: "DevOps Engineer specialising in CI/CD pipelines, container orchestration, and cloud infrastructure. Passionate about automation and SRE practices.",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Notifications state
  const [notif, setNotif] = useState(NOTIF_DEFAULTS);
  const [notifSaved, setNotifSaved] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleProfileSave() {
    setProfileLoading(true);
    setTimeout(() => {
      setProfileLoading(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }, 1000);
  }

  function handlePasswordSave() {
    setPwdError("");
    if (!pwd.current) { setPwdError("Current password is required"); return; }
    if (pwd.next.length < 8) { setPwdError("New password must be at least 8 characters"); return; }
    if (pwd.next !== pwd.confirm) { setPwdError("Passwords do not match"); return; }
    setPwdLoading(true);
    setTimeout(() => {
      setPwdLoading(false);
      setPwdSaved(true);
      setPwd({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSaved(false), 3000);
    }, 1200);
  }

  function handleNotifSave() {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  }

  const pwdStrength = (() => {
    const p = pwd.next;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const pwdStrengthLabel = ["", "Weak", "Fair", "Strong", "Very Strong"][pwdStrength];
  const pwdStrengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"][pwdStrength];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your account preferences and security settings
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2">
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} icon={User} label="Profile" />
        <TabBtn active={tab === "password"} onClick={() => setTab("password")} icon={Lock} label="Password" />
        <TabBtn active={tab === "notifications"} onClick={() => setTab("notifications")} icon={Bell} label="Notifications" />
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Avatar section */}
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                />
                <button className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white border-2 border-white shadow-sm hover:bg-violet-700 transition-colors">
                  <Camera size={13} />
                </button>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.role} · {user?.department}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700">
                    Employee Portal
                  </span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <InputField
                label="Full Name"
                value={profile.name}
                onChange={(v: string) => setProfile((p: any) => ({ ...p, name: v }))}
                icon={User}
                placeholder="Your full name"
              />
              <InputField
                label="Email Address"
                value={profile.email}
                onChange={(v: string) => setProfile((p: any) => ({ ...p, email: v }))}
                icon={Mail}
                type="email"
                placeholder="you@nexusflow.io"
              />
              <InputField
                label="Phone Number"
                value={profile.phone}
                onChange={(v: string) => setProfile((p: any) => ({ ...p, phone: v }))}
                icon={Phone}
                placeholder="+1 (555) 000-0000"
              />
              <InputField
                label="Location"
                value={profile.location}
                onChange={(v: string) => setProfile((p: any) => ({ ...p, location: v }))}
                icon={MapPin}
                placeholder="City, Country"
              />
              <InputField
                label="Department"
                value={profile.department}
                icon={Building2}
                disabled
              />
              <InputField
                label="Employee ID"
                value={user?.id ?? ""}
                icon={Shield}
                disabled
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Professional Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Describe your role, skills, and expertise…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all placeholder:text-slate-300"
              />
              <p className="text-right text-[10px] text-slate-400 mt-1">{profile.bio.length} chars</p>
            </div>

            {/* Save */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Changes are reflected immediately across your portal
              </p>
              <button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${profileSaved
                  ? "bg-emerald-500"
                  : profileLoading
                    ? "bg-violet-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700"
                  }`}
              >
                {profileLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : profileSaved ? (
                  <Check size={15} />
                ) : (
                  <Save size={15} />
                )}
                {profileSaved ? "Saved!" : profileLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSWORD TAB ─────────────────────────────────────────────────── */}
      {tab === "password" && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock size={16} className="text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-800">Change Password</h2>
          </div>

          {pwdError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{pwdError}</p>
            </div>
          )}

          {pwdSaved && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <Check size={14} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">Password updated successfully</p>
            </div>
          )}

          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd.current ? "text" : "password"}
                value={pwd.current}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd((p: any) => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s: any) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd.next ? "text" : "password"}
                value={pwd.next}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd((p: any) => ({ ...p, next: e.target.value }))}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s: any) => ({ ...s, next: !s.next }))}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPwd.next ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            {pwd.next && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${i <= pwdStrength ? pwdStrengthColor : "bg-slate-100"
                        }`}
                    />
                  ))}
                </div>
                <p className={`text-[10px] mt-1 font-medium ${pwdStrength <= 1 ? "text-red-500" : pwdStrength === 2 ? "text-amber-500" : "text-emerald-600"
                  }`}>
                  {pwdStrengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd.confirm ? "text" : "password"}
                value={pwd.confirm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd((p: any) => ({ ...p, confirm: e.target.value }))}
                placeholder="Re-enter new password"
                className={`w-full rounded-xl border py-2.5 px-4 pr-11 text-sm text-slate-700 outline-none transition-all ${pwd.confirm && pwd.confirm !== pwd.next
                  ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
                  : "border-slate-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s: any) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {pwd.confirm && pwd.confirm === pwd.next && (
                <Check size={14} className="absolute right-10 top-3 text-emerald-500" />
              )}
              {pwd.confirm && pwd.confirm !== pwd.next && (
                <X size={14} className="absolute right-10 top-3 text-red-500" />
              )}
            </div>
          </div>

          {/* Password rules */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Password requirements</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { rule: "At least 8 characters", met: pwd.next.length >= 8 },
                { rule: "One uppercase letter", met: /[A-Z]/.test(pwd.next) },
                { rule: "One number", met: /[0-9]/.test(pwd.next) },
                { rule: "One special character", met: /[^A-Za-z0-9]/.test(pwd.next) },
              ].map(({ rule, met }) => (
                <div key={rule} className="flex items-center gap-1.5 text-xs">
                  {met ? (
                    <Check size={11} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span className={met ? "text-emerald-700" : "text-slate-400"}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handlePasswordSave}
              disabled={pwdLoading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${pwdLoading ? "bg-violet-400 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"
                }`}
            >
              {pwdLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Shield size={15} />
              )}
              {pwdLoading ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ────────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div className="space-y-5">
          {/* Email */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1 pb-3 border-b border-slate-100">
              <Mail size={16} className="text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-800">Email Notifications</h2>
            </div>
            <ToggleRow
              label="Project Approvals"
              desc="Receive an email when your project is approved"
              checked={notif.emailApprovals}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, emailApprovals: v }))}
            />
            <ToggleRow
              label="Project Rejections"
              desc="Receive an email when your project is rejected with reviewer notes"
              checked={notif.emailRejections}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, emailRejections: v }))}
            />
            <ToggleRow
              label="Reviewer Comments"
              desc="Notify when a reviewer posts a comment on your project"
              checked={notif.emailComments}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, emailComments: v }))}
            />
            <ToggleRow
              label="SLA Breach Warnings"
              desc="Alert when a project is approaching or has breached its SLA"
              checked={notif.emailSLA}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, emailSLA: v }))}
            />
          </div>

          {/* Push */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1 pb-3 border-b border-slate-100">
              <Bell size={16} className="text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-800">In-App Notifications</h2>
            </div>
            <ToggleRow
              label="Approval Alerts"
              desc="Show in-app badge when projects are approved"
              checked={notif.pushApprovals}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, pushApprovals: v }))}
            />
            <ToggleRow
              label="Rejection Alerts"
              desc="Show in-app badge when projects are rejected"
              checked={notif.pushRejections}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, pushRejections: v }))}
            />
            <ToggleRow
              label="Comment Alerts"
              desc="Show notification dot when new comments arrive"
              checked={notif.pushComments}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, pushComments: v }))}
            />
            <ToggleRow
              label="SLA Alerts"
              desc="Show urgent badge for breached or at-risk SLAs"
              checked={notif.pushSLA}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, pushSLA: v }))}
            />
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1 pb-3 border-b border-slate-100">
              <Bell size={16} className="text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-800">Summary & Digest</h2>
            </div>
            <ToggleRow
              label="Weekly Digest"
              desc="Receive a weekly summary of your project statuses every Monday"
              checked={notif.weeklyDigest}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, weeklyDigest: v }))}
            />
            <ToggleRow
              label="Project Status Updates"
              desc="Notify on any workflow stage change for your projects"
              checked={notif.projectUpdates}
              onChange={(v: boolean) => setNotif((n: any) => ({ ...n, projectUpdates: v }))}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNotifSave}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${notifSaved ? "bg-emerald-500" : "bg-violet-600 hover:bg-violet-700"
                }`}
            >
              {notifSaved ? <Check size={15} /> : <Save size={15} />}
              {notifSaved ? "Preferences Saved!" : "Save Preferences"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
