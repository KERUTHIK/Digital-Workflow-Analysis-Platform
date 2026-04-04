import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Eye,
    EyeOff,
    Hexagon,
    Shield,
    Zap,
    BarChart3,
    AlertCircle,
    Loader2,
    ArrowLeft
} from "lucide-react";
import { api } from "../services/api";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setFieldErrors({});
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await api.auth.register({
                name,
                email,
                password,
                role: "ADMIN", // Only for Admin registration
            });

            setSuccess("Administrator account created successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
            if (err.errors) {
                setFieldErrors(err.errors);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* ── Left Panel ───────────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-indigo-900/70 to-violet-900/80" />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: "48px 48px",
                    }}
                />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                            <Hexagon size={22} className="text-white" fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">NexusFlow</span>
                    </div>

                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Admin Portal<br />
                            <span className="text-indigo-300">Registration</span>
                        </h1>
                        <p className="text-indigo-200/80 leading-relaxed max-w-sm">
                            Create a new administrator account to manage projects, teams, and system configurations.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: Shield, text: "System-wide administrative privileges", color: "text-emerald-400" },
                            { icon: BarChart3, text: "Access to all project analytics", color: "text-blue-400" },
                            { icon: Zap, text: "Configure global workflows and SLAs", color: "text-amber-400" },
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
            </div>

            {/* ── Right Panel ──────────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-8 py-12 bg-slate-50">
                <div className="w-full max-w-md">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-8 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Login
                    </Link>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Create Admin Account</h2>
                        <p className="text-sm text-slate-500 mt-1">Fill in the details to register as a system administrator</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <Shield size={16} className="text-emerald-500 flex-shrink-0" />
                                <p className="text-sm text-emerald-700">{success}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className={`w-full rounded-xl border ${fieldErrors.name ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400`}
                            />
                            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@nexusflow.io"
                                required
                                className={`w-full rounded-xl border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400`}
                            />
                            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={`w-full rounded-xl border ${fieldErrors.password ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 italic">Min. 6 characters required</p>
                            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                "Register Admin Account"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                            Sign in
                        </Link>
                    </p>

                    <p className="text-center text-xs text-slate-400 mt-12">
                        NexusFlow v2.3.1 · IT Services Division · © 2026 NexusFlow Inc.
                    </p>
                </div>
            </div>
        </div>
    );
}
