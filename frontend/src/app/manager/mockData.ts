// ─── Manager-scoped mock data, filtered by managerId ─────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatar: string;
  activeProjects: number;
  completedProjects: number;
  slaCompliance: number;
  status: "Active" | "On Leave" | "Busy";
  managerId: string;
  performanceScore: number;
  approvalRate: number;
  metrics: {
    avgSubmissionTime: number;
    rejectionRate: number;
    taskActive: number;
    taskCompleted: number;
    taskRejected: number;
    onTimeDelivery: number;
    streak: number;
    skillTags: string[];
    monthlyTrend: { month: string; submitted: number; approved: number }[];
  };
}

export const teamMembers: TeamMember[] = [];

export interface ManagerApproval {
  id: string;
  projectId: string;
  title: string;
  client: string;
  budget: number;
  submittedBy: string;
  submittedDate: string;
  slaDeadline: string;
  priority: "High" | "Medium" | "Low";
  department: string;
  riskScore: number;
  deptAvgBudget: number;
  description: string;
  assignedTo: string;
  managerId: string;
}

export const managerApprovals: ManagerApproval[] = [];

export interface TeamProject {
  id: string;
  title: string;
  employeeName: string;
  employeeAvatar: string;
  createdDate: string;
  budget: number;
  priority: "High" | "Medium" | "Low";
  slaStatus: string;
  progress: number;
  managerId: string;
}

export const teamProjects: TeamProject[] = [];

export interface AnalyticsData {
  approvalTimeTrend: { week: string; avgHours: number }[];
  submissionTrend: { month: string; submissions: number; approved: number }[];
  slaBreachTrend: { month: string; breached: number; total: number }[];
  rejectionRate: { month: string; rate: number }[];
  managerEfficiencyScore: number;
  teamPerformanceIndex: number;
}

export const analyticsData: Record<string, AnalyticsData> = {};

export interface ManagerAlert {
  id: string;
  type: "sla" | "budget" | "escalation" | "overdue";
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  time: string;
  managerId: string;
}

export const managerAlerts: ManagerAlert[] = [];
