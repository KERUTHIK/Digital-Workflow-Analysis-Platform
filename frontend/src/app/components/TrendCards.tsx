import React from "react";
import { TrendingUp, Clock, ShieldCheck, ArrowUpRight } from "lucide-react";
import approvalIcon from "../../assets/approval_velocity.png";
import slaIcon from "../../assets/sla_integrity.png";
import volumeIcon from "../../assets/volume_growth.png";

interface TrendCardsProps {
    overviewData: any;
    loading: boolean;
}

function toNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function formatTrend(v: unknown): string | null {
    if (v == null || v === "") return null;
    if (typeof v === "number") {
        const sign = v > 0 ? "+" : "";
        return `${sign}${v}%`;
    }
    return String(v);
}

export function TrendCards({ overviewData, loading }: TrendCardsProps) {
    if (loading || !overviewData) {
        return <div className="h-32 w-full animate-pulse bg-slate-50 rounded-2xl mb-6" />;
    }

    const trends = [
        {
            title: "Approval Velocity",
            value: overviewData.avgApprovalTime || "14h",
            label: "Avg sign-off time",
            trend: formatTrend(overviewData.avgApprovalTimeTrend ?? overviewData.avgApprovalTimeChange),
            isPositive: true,
            icon: Clock,
            image: approvalIcon,
            color: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50",
            metric: toNumber(overviewData.avgApprovalTime)
        },
        {
            title: "SLA Integrity",
            value: `${overviewData.slaCompliance || 94}%`,
            label: "Compliance rate",
            trend: formatTrend(overviewData.slaComplianceTrend ?? overviewData.slaComplianceChange),
            isPositive: true,
            icon: ShieldCheck,
            image: slaIcon,
            color: "from-emerald-500 to-teal-600",
            bg: "bg-emerald-50",
            metric: toNumber(overviewData.slaCompliance)
        },
        {
            title: "Volume Growth",
            value: `${overviewData.totalProjects || 0}`,
            label: "Total projects",
            trend: formatTrend(overviewData.totalProjectsTrend ?? overviewData.totalProjectsChange),
            isPositive: true,
            icon: TrendingUp,
            image: volumeIcon,
            color: "from-violet-500 to-purple-600",
            bg: "bg-violet-50",
            metric: toNumber(overviewData.totalProjects)
        }
    ];
    const maxMetric = Math.max(...trends.map((t) => t.metric || 0), 1);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {trends.map((item, idx) => (
                <div
                    key={idx}
                    className="relative overflow-hidden group bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:border-slate-300"
                >
                    {/* Background Accent */}
                    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 bg-gradient-to-br ${item.color}`} />

                    <div className="flex justify-between items-start mb-4">
                        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${item.bg}`}>
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 object-contain drop-shadow-md transition-transform group-hover:scale-110 duration-500"
                            />
                        </div>
                        {item.trend ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-100">
                                <span className={`text-[10px] font-bold ${item.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.trend}
                                </span>
                                <ArrowUpRight size={10} className={item.isPositive ? 'text-emerald-500' : 'text-rose-500'} />
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <h4 className="text-2xl font-bold text-slate-800 mb-0.5 tracking-tight">{item.value}</h4>
                        <p className="text-sm font-semibold text-slate-600">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.label}</p>
                    </div>

                    {/* Sparkline Overlay */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-50">
                        <div
                            className={`h-full bg-gradient-to-r ${item.color} opacity-40 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                            style={{ width: `${Math.max(20, Math.round((item.metric / maxMetric) * 100))}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
