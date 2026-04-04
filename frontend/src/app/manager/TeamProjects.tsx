import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Users,
  Eye
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { type TeamProject, type TeamMember } from "./mockData";
import TaskAssignModal from "./components/TaskAssignModal";
import ProjectDetailModal from "./components/ProjectDetailModal";
import { api } from "../services/api";

const PRIORITY_STYLES: Record<string, string> = {
  High: "text-red-600",
  Medium: "text-amber-600",
  Low: "text-slate-500",
};

const PAGE_SIZE = 6;

export default function TeamProjectsPage() {
  const { user } = useAuth();
  const mId = user?.id ?? "";

  const [myProjects, setMyProjects] = useState<TeamProject[]>([]);
  const [myTeam, setMyTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<{ id: number; title: string; idLabel: string } | null>(null);
  const [viewingProject, setViewingProject] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch team
        const teamData = await api.manager.getTeam<any[]>();
        const mappedTeam: TeamMember[] = (teamData || []).map((u: any) => {
          return {
            id: `U${u.id.toString().padStart(3, "0")}`,
            name: u.name,
            role: u.role,
            email: u.email,
            department: u.department ?? null,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
            managerId: mId,
            status: "Active" as const,
            slaCompliance: 0,
            activeProjects: 0,
            completedProjects: 0,
            performanceScore: 0,
            approvalRate: 0,
            metrics: {
              avgSubmissionTime: 0,
              rejectionRate: 0,
              onTimeDelivery: 0,
              streak: 0,
              skillTags: [],
              monthlyTrend: [],
            },
          };
        });
        setMyTeam(mappedTeam);

        const projResponse = await api.manager.getTeamProjects<any>({ size: 100 });

        const projData = projResponse?.content || [];
        const projectTasks = await Promise.all(
          projData.map(async (p: any) => {
            try {
              const tasks = await api.manager.getProjectTasks<any[]>(p.id);
              return [p.id, Array.isArray(tasks) ? tasks : []] as const;
            } catch (err) {
              console.error(`Failed to load tasks for project ${p.id}:`, err);
              return [p.id, []] as const;
            }
          })
        );
        const taskMap = new Map<number, any[]>(projectTasks);

        const mappedProjects: TeamProject[] = projData.map((p: any) => {
          // Employee Name mapping remains but column is removed from view
          const empName = p.createdByName || p.createdBy?.name || "Unknown";
          const tasks = taskMap.get(p.id) || [];
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((task: any) => task.status === "COMPLETED").length;
          const progress = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;
          const rawSla = p.slaStatus ?? p.sla;
          const derivedSla = (() => {
            if (rawSla) return String(rawSla);
            const deadlineRaw = p.slaDeadline ?? p.deadline;
            if (!deadlineRaw) return "N/A";
            const deadline = new Date(deadlineRaw);
            if (Number.isNaN(deadline.getTime())) return "N/A";
            return deadline.getTime() < Date.now() ? "Breached" : "On Time";
          })();

          return {
            id: `PRJ-${p.id.toString().padStart(3, "0")}`,
            _rawId: p.id,
            title: p.title,
            employeeName: empName,
            employeeAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(empName)}&background=random`,
            slaStatus: derivedSla,
            priority: p.priority || "Medium",
            progress,
            budget: p.budget || 0,
            createdDate: new Date(p.createdAt).toLocaleDateString(),
            managerId: mId,
          };
        });
        setMyProjects(mappedProjects);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (mId) {
      fetchData();
    }
  }, [mId]);

  const [search, setSearch] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof TeamProject | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(field: keyof TeamProject) {
    if (sortField === field) {
      setSortDir((d: any) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = myProjects.filter((p: TeamProject) => {
      const s = search.toLowerCase();
      const matchSearch =
        s === "" ||
        p.title.toLowerCase().includes(s);
      const matchEmp = filterEmployee === "All" || p.employeeName === filterEmployee;
      const matchPri = filterPriority === "All" || p.priority === filterPriority;
      return matchSearch && matchEmp && matchPri;
    });

    if (sortField) {
      list = [...list].sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (av === undefined || bv === undefined) return 0;
        const cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [myProjects, search, filterEmployee, filterPriority, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ field }: { field: keyof TeamProject }) {
    if (sortField !== field)
      return <ChevronDown size={12} className="text-slate-300 ml-1" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-emerald-500 ml-1" />
    ) : (
      <ChevronDown size={12} className="text-emerald-500 ml-1" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Showing projects from your {myTeam.length} team members
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm">
          <Users size={15} />
          <span className="font-medium text-slate-700">{myTeam.length}</span> team members ·
          <FolderKanban size={15} className="ml-1" />
          <span className="font-medium text-slate-700">{myProjects.length}</span> total projects
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search project…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>
        <select
          value={filterEmployee}
          onChange={(e) => {
            setFilterEmployee(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
        >
          <option value="All">All Members</option>
          {myTeam.map((m: any) => (
            <option key={m.id}>{m.name}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => {
            setFilterPriority(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
        >
          <option value="All">All Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {(
                  [
                    { label: "Project", field: "title" },
                    { label: "Priority", field: "priority" },
                    { label: "Progress", field: "progress" },
                    { label: "Budget", field: "budget" },
                    { label: "Created", field: "createdDate" },
                  ] as { label: string; field: keyof TeamProject }[]
                ).map(({ label, field }) => (
                  <th
                    key={field}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort(field)}
                  >
                    <span className="flex items-center">
                      {label}
                      <SortIcon field={field} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No projects found matching your filters
                  </td>
                </tr>
              )}
              {paginated.map((p: any) => (
                <tr
                  key={p.id}
                  className="hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                  onClick={() => {
                    const rawId = p._rawId ?? Number(p.id.replace("PRJ-", ""));
                    setSelectedProject({ id: rawId, title: p.title, idLabel: p.id });
                  }}
                  title="Click to assign tasks"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${PRIORITY_STYLES[p.priority]}`}>
                      {p.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.progress === 100
                            ? "bg-emerald-500"
                            : p.progress >= 50
                              ? "bg-indigo-500"
                              : "bg-amber-400"
                            }`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    ${p.budget.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {p.createdDate}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingProject(p);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100/50 shadow-sm"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} projects
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
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${page === pg
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-200"
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

      {/* Project Detail Modal */}
      {viewingProject && (
        <ProjectDetailModal
          project={viewingProject}
          onClose={() => setViewingProject(null)}
        />
      )}

      {/* Task Assign Modal */}
      {selectedProject && (
        <TaskAssignModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
