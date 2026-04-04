import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Loader2
} from "lucide-react";

type SortKey = "reviewed" | "sla" | "efficiency";

interface ManagerTableProps {
  managers: any[];
  loading: boolean;
}

export function ManagerTable({ managers, loading }: ManagerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("efficiency");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortedData = [...managers].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(managers.length / itemsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 inline-flex flex-col space-y-0.5">
      <ChevronUp
        size={10}
        className={sortKey === col && sortOrder === "asc" ? "text-slate-800" : "text-slate-300"}
      />
      <ChevronDown
        size={10}
        className={sortKey === col && sortOrder === "desc" ? "text-slate-800" : "text-slate-300"}
      />
    </span>
  );

  const statusColors: Record<string, string> = {
    Good: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Average: "bg-amber-50 text-amber-700 border-amber-100",
    Poor: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-800">Manager Performance Overview</h3>
          {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        {managers.length === 0 && !loading ? (
          <div className="flex items-center justify-center p-20 text-slate-400 italic">
            No manager performance data found for the selected period.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Manager Name</th>
                {(["reviewed", "sla", "efficiency"] as SortKey[]).map((col) => (
                  <th
                    key={col}
                    className="cursor-pointer px-6 py-4 hover:bg-slate-100"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center">
                      {col === "reviewed" ? "Projects Reviewed" : col === "sla" ? "SLA %" : "Efficiency"}
                      <SortIcon col={col} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4">Avg Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((manager: any) => (
                <tr key={manager.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={manager.avatar}
                        alt={manager.name}
                        className="h-9 w-9 rounded-full object-cover shadow-sm bg-slate-50"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{manager.name}</div>
                        <div className="text-xs text-slate-400">{manager.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{manager.reviewed}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${manager.sla === 100 ? "bg-emerald-500" : manager.sla >= 50 ? "bg-indigo-500" : "bg-amber-400"}`}
                          style={{ width: `${manager.sla}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">{manager.sla}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{manager.efficiency}</td>
                  <td className="px-6 py-4">{manager.avgTime}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[manager.status] ?? ""}`}
                    >
                      {manager.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <span className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium">{managers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{" "}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, managers.length)}
          </span>{" "}
          of <span className="font-medium">{managers.length}</span> results
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium disabled:opacity-50 hover:bg-slate-50"
            disabled={currentPage === 1 || loading || managers.length === 0}
            onClick={() => setCurrentPage((c: any) => c - 1)}
          >
            Previous
          </button>
          <button
            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium disabled:opacity-50 hover:bg-slate-50"
            disabled={currentPage === totalPages || loading || managers.length === 0}
            onClick={() => setCurrentPage((c: any) => c + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
