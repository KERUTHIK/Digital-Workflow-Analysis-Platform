import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  PlusCircle,
  Timer,
  FolderKanban
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export interface EmployeeProject {
  id: string;
  rawId?: number;
  title: string;
  department: string;
  client: string;
  budget: number;
  slaDeadline: string;
  slaStatus: string;
  createdDate: string;
  priority: string;
  progress: number;
}

const SLA_STYLES: Record<string, string> = {
  "On Time": "bg-emerald-50 text-emerald-700",
  Breached: "bg-red-50 text-red-700",
  "At Risk": "bg-amber-50 text-amber-700",
};

function SLACountdown({ deadline, status }: { deadline: string; status: string }) {
  const days = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? "Due today"
        : `${days}d left`;
  return (
    <div className={`flex items-center gap-1 text-xs ${SLA_STYLES[status]} rounded-full px-2 py-0.5 font-semibold whitespace-nowrap`}>
      <Timer size={11} />
      {label}
    </div>
  );
}

const PAGE_SIZE = 6;

export default function MyProjectsPage() {
  const { user } = useAuth();

  const [myProjects, setMyProjects] = useState<EmployeeProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  async function fetchProjects() {
    try {
      setLoading(true);
      const [res, taskStats] = await Promise.all([
        api.employee.getMyProjects({ size: 100 }),
        api.employee.getProjectTaskStats<any>(),
      ]);

      const mapped = (res.content || []).map((p: any) => ({
        id: "PRJ-" + p.id.toString().padStart(3, "0"),
        rawId: p.id,
        title: p.title,
        client: p.clientName,
        budget: Number(p.budget ?? 0),
        slaDeadline: p.createdAt,
        slaStatus: "On Time",
        createdDate: p.createdAt ? p.createdAt.split("T")[0] : "",
        department: p.department || "General",
        priority: p.priority || "Medium",
        progress: (() => {
          const projectStats = taskStats?.[p.id] || taskStats?.[String(p.id)];
          const totalTasks = Number(projectStats?.total) || 0;
          const completedTasks = Number(projectStats?.completed) || 0;
          return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        })(),
      }));
      setMyProjects(mapped);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const clients = useMemo(
    () => ["All", ...Array.from(new Set(myProjects.map((p: EmployeeProject) => p.client)))],
    [myProjects]
  );

  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof EmployeeProject>("createdDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(field: keyof EmployeeProject) {
    if (sortField === field) setSortDir((d: "asc" | "desc") => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = myProjects.filter((p: EmployeeProject) => {
      const s = search.toLowerCase();
      const matchSearch =
        s === "" ||
        p.title.toLowerCase().includes(s) ||
        p.client.toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s);
      const matchClient = filterClient === "All" || p.client === filterClient;
      const matchPriority = filterPriority === "All" || p.priority === filterPriority;
      return matchSearch && matchClient && matchPriority;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        const av = String(a[sortField] ?? "");
        const bv = String(b[sortField] ?? "");
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [myProjects, search, filterClient, filterPriority, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ field }: { field: keyof EmployeeProject }) {
    if (sortField !== field) return <ChevronDown size={11} className="text-slate-300 ml-1 inline" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="text-violet-500 ml-1 inline" />
      : <ChevronDown size={11} className="text-violet-500 ml-1 inline" />;
  }

  const COL: { label: string; field: keyof EmployeeProject }[] = [
    { label: "Project ID", field: "id" },
    { label: "Title", field: "title" },
    { label: "Client", field: "client" },
    { label: "Budget", field: "budget" },
    { label: "Progress", field: "progress" },
    { label: "SLA Countdown", field: "slaDeadline" },
    { label: "Created", field: "createdDate" },
    { label: "", field: "id" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {myProjects.length} team-visible projects
          </p>
        </div>
        <Link
          to="/employee/create"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Submit Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, client, or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
          />
        </div>
        <select
          value={filterClient}
          onChange={(e) => { setFilterClient(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
        >
          {clients.map((c: string) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
        >
          {["All", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {COL.map(({ label, field }, idx) => (
                  <th
                    key={idx}
                    onClick={() => label && toggleSort(field)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap ${label ? "cursor-pointer select-none" : ""}`}
                  >
                    {label}
                    {label && <SortIcon field={field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">Loading projects...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FolderKanban size={32} className="text-slate-200" />
                      <p className="text-sm font-medium">No projects found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((p: EmployeeProject) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {p.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-xs whitespace-nowrap max-w-[180px] truncate">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.department}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{p.client}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      ${p.budget.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.progress === 100 ? "bg-emerald-500" : "bg-violet-500"}`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SLACountdown deadline={p.slaDeadline} status={p.slaStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {p.createdDate}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/employee/project/${p.rawId}`}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors whitespace-nowrap"
                      >
                        <Eye size={12} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${page === pg ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
