
export const kpiData: any[] = [];

// Project status data moved to progress-based logic


export const monthlyTrendData: any[] = [];

export const bottleneckData: any[] = [];

export const departmentDelayData: any[] = [];

export const managersData: any[] = [];

export const risksData: any[] = [];

// ─── Projects Page Data ──────────────────────────────────────────────────────

export type SLAStatus = string;
export type Priority = "High" | "Medium" | "Low";

export interface Project {
  id: string;
  rawId: number;
  title: string;
  client: string;
  budget: number;
  slaStatus: SLAStatus;
  createdDate: string;
  department: string;
  teamId?: number;
  teamName?: string;
  description: string;
  manager: string;
  priority: Priority;
  progress: number;
  timeline: ApprovalEvent[];
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
}

export interface ApprovalEvent {
  id: string;
  date: string;
  actor: string;
  action: string;
  note: string;
  status: "approved" | "pending" | "rejected" | "info";
}

export interface ProjectComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  date: string;
}

const STAGES = ["Initial Request", "Tech Review", "Budget Approval", "Security Check", "Final Sign-off"];

export const projectsData: Project[] = [];

// ─── Workflow Templates ──────────────────────────────────────────────────────

export interface WorkflowStage {
  id: string;
  order: number;
  name: string;
  role: string;
  slaHours: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
  createdBy: string;
  createdAt: string;
  status: "Active" | "Inactive";
  projectCount: number;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "WF-001",
    name: "Standard IT Project",
    description: "Default workflow for all IT infrastructure and software projects above $50K.",
    stages: [
      { id: "s1", order: 1, name: "Initial Request", role: "Project Manager", slaHours: 24 },
      { id: "s2", order: 2, name: "Technical Review", role: "Technical Lead", slaHours: 48 },
      { id: "s3", order: 3, name: "Budget Approval", role: "Finance Director", slaHours: 72 },
      { id: "s4", order: 4, name: "Security Check", role: "Security Officer", slaHours: 48 },
      { id: "s5", order: 5, name: "Final Sign-off", role: "CTO / VP Engineering", slaHours: 24 },
    ],
    createdBy: "Alex Morgan",
    createdAt: "2024-01-15",
    status: "Active",
    projectCount: 87,
  },
  {
    id: "WF-002",
    name: "Fast-Track Approval",
    description: "Expedited 3-stage workflow for urgent projects under $25K with minimal risk.",
    stages: [
      { id: "s1", order: 1, name: "Request Validation", role: "Project Manager", slaHours: 8 },
      { id: "s2", order: 2, name: "Manager Approval", role: "Department Head", slaHours: 16 },
      { id: "s3", order: 3, name: "Finance Sign-off", role: "Finance Director", slaHours: 8 },
    ],
    createdBy: "Sarah Jenkins",
    createdAt: "2024-03-22",
    status: "Active",
    projectCount: 45,
  },
  {
    id: "WF-003",
    name: "Compliance & Audit",
    description: "Strict workflow for regulatory and compliance projects requiring legal review.",
    stages: [
      { id: "s1", order: 1, name: "Initial Submission", role: "Compliance Officer", slaHours: 24 },
      { id: "s2", order: 2, name: "Legal Review", role: "Legal Counsel", slaHours: 96 },
      { id: "s3", order: 3, name: "Risk Assessment", role: "Risk Manager", slaHours: 48 },
      { id: "s4", order: 4, name: "Executive Approval", role: "CEO / COO", slaHours: 24 },
    ],
    createdBy: "Amanda Torres",
    createdAt: "2024-05-10",
    status: "Active",
    projectCount: 23,
  },
  {
    id: "WF-004",
    name: "Software Development",
    description: "Agile-aligned workflow for product and feature development projects.",
    stages: [
      { id: "s1", order: 1, name: "Product Brief", role: "Product Owner", slaHours: 24 },
      { id: "s2", order: 2, name: "Technical Design", role: "Technical Lead", slaHours: 48 },
      { id: "s3", order: 3, name: "Security Review", role: "Security Officer", slaHours: 24 },
      { id: "s4", order: 4, name: "Budget Confirmation", role: "Finance Director", slaHours: 48 },
      { id: "s5", order: 5, name: "Release Approval", role: "CTO", slaHours: 16 },
    ],
    createdBy: "Robert Patel",
    createdAt: "2024-06-18",
    status: "Active",
    projectCount: 62,
  },
  {
    id: "WF-005",
    name: "Vendor Onboarding",
    description: "Procurement workflow for new vendor evaluation and contract approval.",
    stages: [
      { id: "s1", order: 1, name: "Vendor Assessment", role: "Procurement Manager", slaHours: 48 },
      { id: "s2", order: 2, name: "Technical Due Diligence", role: "Technical Lead", slaHours: 72 },
      { id: "s3", order: 3, name: "Legal Contract Review", role: "Legal Counsel", slaHours: 120 },
      { id: "s4", order: 4, name: "Finance Approval", role: "CFO", slaHours: 48 },
    ],
    createdBy: "Amanda Torres",
    createdAt: "2024-08-05",
    status: "Inactive",
    projectCount: 18,
  },
];

// ─── SLA Monitoring Data ─────────────────────────────────────────────────────

export const slaBreachesPerStage: any[] = [];

export const slaTrendData: any[] = [];

export interface SLABreach {
  id: string;
  projectName: string;
  stage: string;
  assignedTo: string;
  slaDeadline: string;
  delayDuration: string;
  delayHours: number;
  escalationLevel: "L1" | "L2" | "L3";
}

export const slaBreachedProjects: SLABreach[] = [];

// ─── Audit Logs Data ─────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  project: string;
  oldStatus: string;
  newStatus: string;
  ipAddress: string;
}

export const auditLogsData: AuditLog[] = [];

// ─── Users Data (Settings) ───────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  joinedDate: string;
  avatar: string;
}

export const usersData: User[] = [];

// ─── Teams Data ───────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  department: string;
  color: string;
  description: string;
  managerId: string;
  memberIds: string[];
  createdAt: string;
}

export const teamsData: Team[] = [];

// ─── James Mitchell Projects ──────────────────────────────────────────────────

export const jamesProjects: Project[] = [];
