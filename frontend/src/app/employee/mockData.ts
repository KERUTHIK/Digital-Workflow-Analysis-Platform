// ─── Employee-scoped mock data, filtered by employeeId ───────────────────────

export type SLAStatus = "On Time" | "Breached" | "At Risk";
export type Priority = "High" | "Medium" | "Low";
export type RiskCategory = "High" | "Medium" | "Low";
export type StageStatus = "approved" | "pending" | "rejected" | "info" | "skipped";

export interface TimelineEvent {
  id: string;
  date: string;
  actor: string;
  role: string;
  action: string;
  note: string;
  status: StageStatus;
}

export interface ReviewerComment {
  id: string;
  author: string;
  role: string;
  avatar: string;
  text: string;
  date: string;
  type: "info" | "concern" | "approval" | "rejection";
}

export interface EmployeeProject {
  id: string;
  title: string;
  client: string;
  budget: number;
  slaStatus: SLAStatus;
  slaDeadline: string;
  createdDate: string;
  priority: Priority;
  riskCategory: RiskCategory;
  description: string;
  timeline: string;
  resourceRequirement: string;
  department: string;
  progress: number;
  employeeId: string;
  approvalTimeline: TimelineEvent[];
  reviewerComments: ReviewerComment[];
  rejectionReason?: string;
}

export const employeeProjects: EmployeeProject[] = [];

// ─── Analytics data ───────────────────────────────────────────────────────────

export interface EmployeeAnalytics {
  submissionTrend: { month: string; count: number }[];
  approvalTimeTrend: { month: string; avgDays: number }[];
  rejectionTrend: { month: string; rate: number }[];
  approvalRate: number;
  avgProcessingDays: number;
  mostCommonRejectionReason: string;
  totalSubmitted: number;
  totalApproved: number;
  totalRejected: number;
}

export const employeeAnalytics: Record<string, EmployeeAnalytics> = {};
