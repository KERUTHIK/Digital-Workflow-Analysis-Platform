import { useEffect, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Globe,
  Save,
  Eye,
  EyeOff,
  Plane,
  CheckCircle,
  Shield,
  Mail,
  Smartphone,
  Monitor
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
          <Icon size={17} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-emerald-500" : "bg-slate-200"
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </button>
    </div>
  );
}

export default function ManagerSettings() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
    role: user?.role ?? "",
    phone: "+1 (555) 234-5678",
    timezone: "UTC-5 (Eastern)",
    language: "English (US)",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPwd: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    newPwd: false,
    confirm: false,
  });

  const [delegationMode, setDelegationMode] = useState(false);
  const [delegateTo, setDelegateTo] = useState("Select delegate…");
  const [delegateOptions, setDelegateOptions] = useState<string[]>([]);

  const [notifications, setNotifications] = useState({
    emailApprovals: true,
    emailSLA: true,
    emailEscalations: true,
    pushBrowser: false,
    mobilePush: true,
    weeklyDigest: true,
    dailySummary: false,
    urgentOnly: false,
  });

  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  useEffect(() => {
    async function loadDelegates() {
      try {
        const team = await api.manager.getTeam<any[]>();
        const options = (Array.isArray(team) ? team : [])
          .filter((member: any) => member?.name && String(member?.id) !== String(user?.id))
          .map((member: any) => `${member.name}${member.role ? ` (${member.role})` : ""}`);
        setDelegateOptions(options);
      } catch {
        setDelegateOptions([]);
      }
    }

    loadDelegates();
  }, [user?.id]);

  function handleSaveProfile() {
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  }

  function handleSavePassword() {
    if (passwords.newPwd !== passwords.confirm) return;
    setSavedPassword(true);
    setPasswords({ current: "", newPwd: "", confirm: "" });
    setTimeout(() => setSavedPassword(false), 2500);
  }

  function handleSaveNotif() {
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 2500);
  }

  function PasswordField({
    label,
    field,
  }: {
    label: string;
    field: "current" | "newPwd" | "confirm";
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
        <div className="relative">
          <input
            type={showPwd[field] ? "text" : "password"}
            value={passwords[field]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPasswords((prev: any) => ({ ...prev, [field]: e.target.value }))
            }
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() =>
              setShowPwd((prev: any) => ({ ...prev, [field]: !prev[field] }))
            }
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPwd[field] ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your profile, security, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Profile ──────────────────────────────────────── */}
        <SectionCard
          title="Profile Information"
          subtitle="Update your personal details"
          icon={User}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role} · {user?.department}</p>
              <button className="mt-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
                Change photo
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(
              [
                { label: "Full Name", field: "name" },
                { label: "Email Address", field: "email" },
                { label: "Phone Number", field: "phone" },
                { label: "Department", field: "department" },
              ] as { label: string; field: string }[]
            ).map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {label}
                </label>
                <input
                  type="text"
                  value={(profile as any)[field]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProfile((prev: any) => ({ ...prev, [field]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 focus:bg-white transition-all"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Timezone
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setProfile((prev: any) => ({ ...prev, timezone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400"
                >
                  <option>UTC-5 (Eastern)</option>
                  <option>UTC-6 (Central)</option>
                  <option>UTC-8 (Pacific)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+5:30 (IST)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Language
                </label>
                <select
                  value={profile.language}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setProfile((prev: any) => ({ ...prev, language: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400"
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${savedProfile
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
          >
            {savedProfile ? (
              <>
                <CheckCircle size={15} /> Saved!
              </>
            ) : (
              <>
                <Save size={15} /> Save Profile
              </>
            )}
          </button>
        </SectionCard>

        {/* ── Change Password ───────────────────────────────── */}
        <SectionCard
          title="Change Password"
          subtitle="Keep your account secure"
          icon={Lock}
        >
          <div className="space-y-3">
            <PasswordField label="Current Password" field="current" />
            <PasswordField label="New Password" field="newPwd" />
            <PasswordField label="Confirm New Password" field="confirm" />

            {passwords.newPwd && passwords.confirm && passwords.newPwd !== passwords.confirm && (
              <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
            )}

            {/* Strength indicator */}
            {passwords.newPwd && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Password strength</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${passwords.newPwd.length >= i * 3
                        ? i <= 1
                          ? "bg-red-400"
                          : i <= 2
                            ? "bg-amber-400"
                            : i <= 3
                              ? "bg-blue-400"
                              : "bg-emerald-500"
                        : "bg-slate-200"
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Security tips */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-blue-500" />
                <p className="text-xs font-semibold text-blue-700">Security tips</p>
              </div>
              {[
                "At least 8 characters",
                "Mix of letters, numbers & symbols",
                "Different from previous 3 passwords",
              ].map((t) => (
                <p key={t} className="text-[10px] text-blue-600 pl-4">· {t}</p>
              ))}
            </div>
          </div>

          <button
            onClick={handleSavePassword}
            disabled={
              !passwords.current ||
              !passwords.newPwd ||
              passwords.newPwd !== passwords.confirm
            }
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${savedPassword
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
              }`}
          >
            {savedPassword ? (
              <>
                <CheckCircle size={15} /> Password Updated!
              </>
            ) : (
              <>
                <Lock size={15} /> Update Password
              </>
            )}
          </button>
        </SectionCard>

        {/* ── Delegation Mode ───────────────────────────────── */}
        <SectionCard
          title="Delegation Mode"
          subtitle="Assign approvals to a colleague during absence"
          icon={Plane}
        >
          <div
            className={`rounded-xl border-2 p-4 transition-all ${delegationMode
              ? "border-amber-300 bg-amber-50"
              : "border-slate-100 bg-slate-50"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${delegationMode ? "bg-amber-200" : "bg-slate-200"
                    }`}
                >
                  <Plane
                    size={18}
                    className={delegationMode ? "text-amber-700" : "text-slate-500"}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Vacation Mode</p>
                  <p className="text-xs text-slate-500">
                    {delegationMode
                      ? "Active — approvals are being delegated"
                      : "Inactive — you handle all approvals"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDelegationMode(!delegationMode)}
                className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none ${delegationMode ? "bg-amber-500" : "bg-slate-300"
                  }`}
                style={{ width: "52px" }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${delegationMode ? "translate-x-7" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>

          {delegationMode && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800">
                  ⚠ Delegation is active
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  All new approval requests will be routed to your delegate.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Delegate To
                </label>
                <select
                  value={delegateTo}
                  onChange={(e) => setDelegateTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400"
                >
                  <option>Select delegate…</option>
                  {delegateOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Until Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Notification Preferences ──────────────────────── */}
        <SectionCard
          title="Notification Preferences"
          subtitle="Choose how you want to be notified"
          icon={Bell}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Mail size={11} /> Email Notifications
            </p>
            <Toggle
              checked={notifications.emailApprovals}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, emailApprovals: v }))}
              label="New Approval Requests"
              desc="Notified when a new project is submitted for your review"
            />
            <Toggle
              checked={notifications.emailSLA}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, emailSLA: v }))}
              label="SLA Breach Alerts"
              desc="Warned before and when SLA deadlines are missed"
            />
            <Toggle
              checked={notifications.emailEscalations}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, emailEscalations: v }))}
              label="Escalation Notices"
              desc="Notified when items are escalated to senior leadership"
            />

            <div className="my-3 h-px bg-slate-100" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Smartphone size={11} /> Push Notifications
            </p>
            <Toggle
              checked={notifications.pushBrowser}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, pushBrowser: v }))}
              label="Browser Push"
              desc="Real-time alerts in your browser"
            />
            <Toggle
              checked={notifications.mobilePush}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, mobilePush: v }))}
              label="Mobile Push"
              desc="Alerts on the NexusFlow mobile app"
            />

            <div className="my-3 h-px bg-slate-100" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Monitor size={11} /> Digest & Summary
            </p>
            <Toggle
              checked={notifications.weeklyDigest}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, weeklyDigest: v }))}
              label="Weekly Digest Email"
              desc="Summary of team performance every Monday"
            />
            <Toggle
              checked={notifications.dailySummary}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, dailySummary: v }))}
              label="Daily Activity Summary"
              desc="End-of-day summary of approvals and updates"
            />
            <Toggle
              checked={notifications.urgentOnly}
              onChange={(v: boolean) => setNotifications((p: any) => ({ ...p, urgentOnly: v }))}
              label="Urgent Items Only"
              desc="Only notify for critical & high-priority items"
            />
          </div>

          <button
            onClick={handleSaveNotif}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${savedNotif
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
          >
            {savedNotif ? (
              <>
                <CheckCircle size={15} /> Preferences Saved!
              </>
            ) : (
              <>
                <Save size={15} /> Save Preferences
              </>
            )}
          </button>
        </SectionCard>
      </div >
    </div >
  );
}
