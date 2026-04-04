import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Paperclip
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const PRIORITY_COLORS = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_COLORS = {
  Pending: "bg-blue-50 text-blue-700",
  "Under Review": "bg-purple-50 text-purple-700",
};

function RiskGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "#ef4444" : score >= 45 ? "#f59e0b" : "#10b981";
  const label = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
  const R = 32;
  const C = Math.PI * R;
  const filled = (score / 100) * C;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="50" viewBox="0 0 80 50">
        <path
          d="M8 46 A 32 32 0 0 1 72 46"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M8 46 A 32 32 0 0 1 72 46"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${C}`}
          strokeDashoffset={0}
        />
        <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">
          {score}
        </text>
      </svg>
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label} Risk
      </span>
    </div>
  );
}

function BudgetBar({
  budget,
  deptAvg,
}: {
  budget: number;
  deptAvg: number;
}) {
  const max = Math.max(budget, deptAvg) * 1.2;
  const budgetPct = (budget / max) * 100;
  const avgPct = (deptAvg / max) * 100;
  const diff = budget - deptAvg;
  const diffPct = Math.round((diff / deptAvg) * 100);

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>This Project</span>
          <span className="font-semibold text-slate-800">${budget.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Dept. Average</span>
          <span className="font-semibold text-slate-800">${deptAvg.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-400 transition-all"
            style={{ width: `${avgPct}%` }}
          />
        </div>
      </div>
      <p
        className={`text-xs font-medium ${diff > 0 ? "text-red-600" : "text-emerald-600"
          }`}
      >
        {diff > 0 ? "↑" : "↓"} {Math.abs(diffPct)}% {diff > 0 ? "above" : "below"} dept.
        average
      </p>
    </div>
  );
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const mId = user?.id ?? "";

  const [myApprovals, setMyApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending approvals on mount
  useState(() => {
    const fetchApprovals = async () => {
      try {
        const data = await api.manager.getPendingApprovals();
        // Map backend ApprovalResponse to frontend expected format
        const mapped = data.map((a: any) => ({
          id: a.id,
          projectId: `PRJ-00${a.projectId}`, // Fake formatting if needed
          realProjectId: a.projectId,
          title: a.projectTitle || "Unknown Project",
          client: a.clientName || "Unknown Client",
          budget: a.projectBudget || 0,
          submittedDate: a.submittedDate ? new Date(a.submittedDate).toLocaleDateString() : "-",
          slaDeadline: a.slaDeadline ? new Date(a.slaDeadline).toLocaleDateString() : "-",
          priority: a.priority || "Medium",
          status: "Pending", // Because we only fetch pending
          submittedBy: a.submittedBy || "Unknown",
          department: a.projectDepartment || "General",
          deptAvgBudget: 50000, // mock
          riskScore: 30, // mock
          description: "Project pending your approval."
        }));
        setMyApprovals(mapped);
      } catch (err) {
        console.error("Failed to fetch approvals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  });

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [comment, setComment] = useState("");
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Fetch attachments when a project is selected
  useEffect(() => {
    if (!selected) {
      setAttachments([]);
      return;
    }
    const fetchAtt = async () => {
      setLoadingAttachments(true);
      try {
        const data = await api.projects.getAttachments(selected.realProjectId);
        setAttachments(data || []);
      } catch (err) {
        console.error("Failed to load attachments:", err);
        setAttachments([]);
      } finally {
        setLoadingAttachments(false);
      }
    };
    fetchAtt();
  }, [selected?.realProjectId]);

  const filtered = useMemo(() => {
    return myApprovals.filter((a: any) => {
      const matchSearch =
        search === "" ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.client?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (a.submittedBy?.toLowerCase() || "").includes(search.toLowerCase());
      const matchPriority = filterPriority === "All" || a.priority === filterPriority;
      const matchStatus = filterStatus === "All" || a.status === filterStatus;
      return matchSearch && matchPriority && matchStatus;
    });
  }, [myApprovals, search, filterPriority, filterStatus]);

  async function handleDecision(realProjectId: number, decision: "approved" | "rejected") {
    try {
      if (decision === "approved") {
        await api.manager.approve(realProjectId, { comment });
      } else {
        await api.manager.reject(realProjectId, { comment });
      }
      // Update UI optimistically using the project ID
      setDecisions((prev: any) => ({ ...prev, [realProjectId]: decision }));
      setSelected(null);
      setComment("");
    } catch (err) {
      console.error(`Failed to ${decision} project:`, err);
      alert(`Could not process ${decision}.`);
    }
  }

  const totalBudget = myApprovals.reduce((s: number, a: any) => s + a.budget, 0);

  return (
    <div className="flex gap-6 h-full">
      {/* ── Left: Table Panel ─────────────────────────────── */}
      <div className={`flex flex-col gap-4 transition-all ${selected ? "w-[58%]" : "w-full"}`}>
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {myApprovals.length} items assigned to you · Total budget:{" "}
            <span className="font-semibold text-slate-700">
              ${totalBudget.toLocaleString()}
            </span>
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Pending",
              count: myApprovals.filter((a: any) => a.status === "Pending").length,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Under Review",
              count: myApprovals.filter((a: any) => a.status === "Under Review").length,
              color: "bg-purple-50 text-purple-700",
            },
            {
              label: "Decided Today",
              count: Object.keys(decisions).length,
              color: "bg-emerald-50 text-emerald-700",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects, clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
          >
            {["All", "High", "Medium", "Low"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
          >
            {["All", "Pending", "Under Review"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Project", "Client", "Budget", "Submitted", "SLA Deadline", "Priority", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                      No approvals found
                    </td>
                  </tr>
                )}
                {filtered.map((a: any) => {
                  const decided = decisions[a.realProjectId];
                  const isSelected = selected?.id === a.id;
                  return (
                    <tr
                      key={a.id}
                      className={`cursor-pointer transition-colors ${isSelected
                        ? "bg-emerald-50"
                        : decided
                          ? "bg-slate-50 opacity-60"
                          : "hover:bg-slate-50/60"
                        }`}
                      onClick={() => !decided && setSelected(isSelected ? null : a)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                          {a.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.projectId}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {a.client}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                        ${a.budget.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {a.submittedDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs whitespace-nowrap ${new Date(a.slaDeadline) < new Date()
                            ? "text-red-600 font-semibold"
                            : "text-slate-500"
                            }`}
                        >
                          {a.slaDeadline}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${(PRIORITY_COLORS as any)[a.priority]
                            }`}
                        >
                          {a.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {decided ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${decided === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                              }`}
                          >
                            {decided === "approved" ? "Approved" : "Rejected"}
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${(STATUS_COLORS as any)[a.status]
                              }`}
                          >
                            {a.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!decided && (
                          <ChevronRight size={14} className="text-slate-300" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Right: Review Panel ────────────────────────────── */}
      {selected && (
        <div className="flex-1 min-w-[340px] max-w-[42%]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden sticky top-0">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Review Request
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selected.projectId}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Project summary */}
              <div>
                <h3 className="text-base font-bold text-slate-800">{selected.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selected.description}</p>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User, label: "Submitted by", val: selected.submittedBy },
                  { icon: DollarSign, label: "Budget", val: `$${selected.budget.toLocaleString()}` },
                  { icon: Calendar, label: "Submitted", val: selected.submittedDate },
                  { icon: Clock, label: "SLA Deadline", val: selected.slaDeadline },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Icon size={12} />
                      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{val}</p>
                  </div>
                ))}
              </div>

              {/* Priority + Status */}
              <div className="flex gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${(PRIORITY_COLORS as any)[selected.priority]
                    }`}
                >
                  {selected.priority} Priority
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {selected.department}
                </span>
              </div>

              {/* Budget vs Avg */}
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-700">Budget vs Dept. Average</p>
                </div>
                <BudgetBar budget={selected.budget} deptAvg={selected.deptAvgBudget} />
              </div>

              {/* Risk Score */}
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <p className="text-xs font-semibold text-slate-700">Risk Score</p>
                </div>
                <div className="flex items-center justify-between">
                  <RiskGauge score={selected.riskScore} />
                  <div className="flex-1 ml-4 space-y-1.5 text-xs text-slate-500">
                    <p>
                      <span className="font-medium text-slate-700">Complexity:</span>{" "}
                      {selected.riskScore >= 70 ? "High" : selected.riskScore >= 45 ? "Medium" : "Low"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-700">Dept:</span> {selected.department}
                    </p>
                    <p>
                      <span className="font-medium text-slate-700">Client:</span> {selected.client}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comment box */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">Review Comment</p>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your review notes or conditions for approval…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition-all"
                />
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">Attached Files</p>
                </div>

                {loadingAttachments ? (
                  <p className="text-xs text-slate-400">Loading files...</p>
                ) : attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files attached to this project.</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Paperclip size={14} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-700 truncate">{file.fileName}</span>
                        </div>
                        <a
                          href={file.fileUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleDecision(selected.realProjectId, "rejected")}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  onClick={() => handleDecision(selected.realProjectId, "approved")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
