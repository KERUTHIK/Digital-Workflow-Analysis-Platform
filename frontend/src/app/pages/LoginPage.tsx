import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Hexagon,
  Shield,
  Zap,
  BarChart3,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth, getRoleDashboardPath, mapBackendRole } from "../context/AuthContext";
import { api } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });

      const user = {
        id: response.userId.toString(),
        name: response.name,
        email: response.email,
        role: mapBackendRole(response.role),
        department: response.department || "General",
        avatar: response.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=facearea&facepad=2"
      };

      login(user, response.token);
      navigate(getRoleDashboardPath(user.role), { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1760776066208-427bfa12dbe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-indigo-900/70 to-violet-900/80" />

        {/* Grid lines overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Hexagon size={22} className="text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">NexusFlow</span>
          </div>

          {/* Headline */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Digital Project<br />
              <span className="text-indigo-300">Approval &</span><br />
              Workflow Platform
            </h1>
            <p className="text-indigo-200/80 leading-relaxed max-w-sm">
              Streamline approvals, track SLA compliance, and empower your teams with intelligent workflow automation.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              { icon: Shield, text: "Role-based access control for 500+ users", color: "text-emerald-400" },
              { icon: BarChart3, text: "Real-time approval analytics & SLA tracking", color: "text-blue-400" },
              { icon: Zap, text: "Automated workflow routing & escalations", color: "text-amber-400" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                  <Icon size={16} className={color} />
                </div>
                <span className="text-sm text-indigo-100/80">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "500+", label: "Active Users" },
            { value: "94.2%", label: "SLA Compliance" },
            { value: "1,248", label: "Projects Tracked" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3">
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-indigo-200/70 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Hexagon size={18} fill="currentColor" />
            </div>
            <span className="text-lg font-bold text-slate-800">NexusFlow</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your NexusFlow account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nexusflow.io"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in to NexusFlow"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Need an admin account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              Register as Admin
            </button>
          </p>

          <p className="text-center text-xs text-slate-400 mt-6">
            NexusFlow v2.3.1 · IT Services Division · © 2026 NexusFlow Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
