import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Hexagon,
  UsersRound
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: Users, label: "Manager Perf.", path: "/performance" },
  { icon: UsersRound, label: "Teams", path: "/teams" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform">
      <div className="flex h-full flex-col">
        {/* Logo Area */}
        <div className="flex h-16 items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Hexagon size={20} fill="currentColor" />
            </div>
            <span className="text-lg">NexusFlow</span>
          </div>
        </div>

        {/* User info strip */}
        {user && (
          <div className="mx-3 mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-indigo-100 text-indigo-700">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Main Menu</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <item.icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                    {item.label}
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-3 h-px bg-slate-100 mx-3" />

          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account</p>
          <ul className="space-y-0.5">
            <li>
              <Link
                to="/settings"
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === "/settings"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Settings size={18} className={location.pathname === "/settings" ? "text-indigo-600" : "text-slate-400"} />
                Settings
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer / Logout */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
