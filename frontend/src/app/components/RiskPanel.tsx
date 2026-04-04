import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Loader2
} from "lucide-react";
import clsx from "clsx";

interface RiskPanelProps {
  risks: any[];
  loading: boolean;
}

export function RiskPanel({ risks, loading }: RiskPanelProps) {
  return (
    <div className="rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-red-50 px-6 py-4 bg-red-50/30">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-red-100 p-1.5 text-red-600">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
          </div>
          <h3 className="text-lg font-bold text-slate-800">Risk & Escalation</h3>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
          {risks.length}
        </span>
      </div>

      <div className="p-4 space-y-3 min-h-[300px]">
        {risks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4">
            <div className="bg-emerald-50 text-emerald-500 rounded-full p-3 mb-2">
              <TrendingUp size={24} />
            </div>
            <p className="text-sm font-medium">All projects on track</p>
            <p className="text-[11px]">No SLA breaches detected.</p>
          </div>
        ) : (
          risks.map((risk, idx) => (
            <div
              key={risk.id || idx}
              className="group flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 hover:border-red-100 hover:bg-red-50/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-lg shadow-sm border",
                    risk.escalationLevel === "L3"
                      ? "bg-red-50 border-red-100 text-red-600"
                      : "bg-amber-50 border-amber-100 text-amber-600"
                  )}
                >
                  {risk.delayHours > 48 ? <AlertTriangle size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-red-700 transition-colors">
                    {risk.projectName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {risk.stage} • {risk.assignedTo}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-red-500">
                  +{risk.delayDuration}
                </span>
                <span
                  className={clsx(
                    "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    risk.escalationLevel === "L3"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {risk.escalationLevel}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 p-3 text-center">
        <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          View All Escalations
        </button>
      </div>
    </div>
  );
}
