import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getRoleBadge(role: string) {
  if (role === "System Admin") return "text-indigo-500";
  if (role === "Senior Manager" || role === "Manager") return "text-emerald-600";
  return "text-amber-600";
}

export function TopNavbar() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-6">
      {/* Search */}
      <div className="flex flex-1 items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search projects, clients…"
            className="w-full rounded-lg bg-slate-100 pl-10 pr-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        {/* Date Filter */}
        <div className="relative">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Calendar size={15} />
            {dateRange}
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Notifications */}
        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
          <Bell size={20} />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative border-l border-slate-200 pl-5">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.name ?? "Guest"}
              </p>
              <p className={`text-xs font-medium ${getRoleBadge(user?.role ?? "")}`}>
                {user?.role ?? "—"}
              </p>
            </div>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full border-2 border-slate-100 object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex-shrink-0">
                {user?.name?.[0] ?? "?"}
              </div>
            )}
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                <div className="border-b border-slate-100 px-4 pb-3 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
