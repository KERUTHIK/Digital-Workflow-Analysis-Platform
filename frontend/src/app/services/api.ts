import { TOKEN_KEY } from "../constants";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers,
    cache: "no-store",
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: null }));
    const errorMessage = errorData.message || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMessage);
    error.errors = errorData.errors;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  const result = await response.json();
  // Unwrap Spring Backend ApiResponse wrapper
  return result.data;
}

export const api = {
  auth: {
    login: (credentials: any) => request<any>("/auth/login", { method: "POST", body: credentials }),
    register: (data: any) => request<any>("/auth/register", { method: "POST", body: data }),
  },

  admin: {
    getUsers: <T = any[]>(params?: any) => request<T>("/admin/users" + (params ? "?" + new URLSearchParams(params) : "")),
    getProjects: <T = any>(params: any) => request<T>("/admin/projects?" + new URLSearchParams(params)),
    getAuditLogs: <T = any>(params: any) => request<T>("/admin/audit-logs?" + new URLSearchParams(params)),
    createProject: <T = any>(data: any) => request<T>("/admin/projects", { method: "POST", body: data }),
    deleteUser: (id: number) => request<void>(`/admin/user/${id}`, { method: "DELETE" }),
    createUser: <T = any>(data: any) => request<T>("/admin/user", { method: "POST", body: data }),
  },

  teams: {
    getAll: <T = any[]>() => request<T>("/teams"),
    create: <T = any>(data: any) => request<T>("/teams", { method: "POST", body: data }),
    update: <T = any>(id: number, data: any) => request<T>(`/teams/${id}`, { method: "PUT", body: data }),
    delete: (id: number) => request<void>(`/teams/${id}`, { method: "DELETE" }),
  },

  workflows: {
    getAll: <T = any[]>() => request<T>("/workflows"),
    save: <T = any>(data: any) => request<T>("/workflows", { method: "POST", body: data }),
    delete: (id: number) => request<void>(`/workflows/${id}`, { method: "DELETE" }),
  },

  statistics: {
    getOverview: () => request<any>("/statistics/overview"),
    getAdminAnalytics: (params?: { startDate?: string; endDate?: string }) =>
      request<any>("/statistics/admin-analytics" + (params ? "?" + new URLSearchParams(params as any) : "")),
  },

  manager: {
    getTeam: <T = any[]>() => request<T>("/manager/team"),
    getTeamProjects: <T = any>(params: any) => request<T>("/manager/team-projects?" + new URLSearchParams(params)),
    getPendingApprovals: <T = any[]>() => request<T>("/manager/pending-approvals"),
    approve: <T = any>(id: number, data?: any) => request<T>(`/manager/approve/${id}`, { method: "POST", body: data }),
    reject: <T = any>(id: number, data?: any) => request<T>(`/manager/reject/${id}`, { method: "POST", body: data }),
    getProjectTasks: <T = any[]>(projectId: number) => request<T>(`/manager/project/${projectId}/tasks`),
    assignTasks: <T = any>(projectId: number, tasks: any[]) =>
      request<T>(`/manager/project/${projectId}/tasks`, { method: "POST", body: tasks }),
    getTaskReviews: <T = any[]>() => request<T>("/manager/task-reviews"),
    approveTask: <T = any>(taskId: number) => request<T>(`/manager/task/${taskId}/approve`, { method: "POST" }),
    rejectTask: <T = any>(taskId: number, feedback?: string) =>
      request<T>(`/manager/task/${taskId}/reject`, { method: "POST", body: { feedback: feedback ?? "" } }),
    getTeamTrends: <T = any>() => request<T>("/manager/team/trends"),
    getTeamStats: <T = any>() => request<T>("/manager/member-stats"),
    getProjectTaskStats: <T = any>() => request<T>("/manager/projects/task-stats"),
    getAnalytics: <T = any>(params: { startDate: string; endDate: string }) =>
      request<T>("/manager/analytics?" + new URLSearchParams(params)),
  },

  employee: {
    createProject: <T = any>(data: any) => request<T>("/employee/projects", { method: "POST", body: data }),
    getMyProjects: <T = any>(params: any) => request<T>("/employee/my-projects?" + new URLSearchParams(params)),
    getProjectTaskStats: <T = any>() => request<T>("/employee/projects/task-stats"),
    updateProject: <T = any>(id: number, data: any) => request<T>(`/employee/project/${id}`, { method: "PUT", body: data }),
    getProject: <T = any>(id: number) => request<T>(`/employee/project/${id}`),
    submitProject: <T = any>(id: number) => request<T>(`/employee/project/${id}/submit`, { method: "POST" }),
    getMyTasks: <T = any[]>() => request<T>("/employee/my-tasks"),
    /** Submit current active phase with a note and optional repo link */
    submitPhase: <T = any>(taskId: number, note?: string, repositoryLink?: string) =>
      request<T>(`/employee/task/${taskId}/submit-phase`, { method: "POST", body: { note: note ?? "", repositoryLink: repositoryLink ?? "" } }),
    /** Legacy alias */
    submitTask: <T = any>(taskId: number, note?: string, repositoryLink?: string) =>
      request<T>(`/employee/task/${taskId}/submit-phase`, { method: "POST", body: { note: note ?? "", repositoryLink: repositoryLink ?? "" } }),
    getAnalytics: <T = any>() => request<T>("/statistics/employee-analytics"),
  },

  projects: {
    getTimeline: <T = any[]>(id: number) => request<T>(`/projects/${id}/timeline`),
    getAttachments: <T = any[]>(id: number) => request<T>(`/projects/${id}/attachments`),
    addAttachment: <T = any>(id: number, data: any) => request<T>(`/projects/${id}/attachments`, { method: "POST", body: data }),
    getSubmissions: <T = any[]>(id: number) => request<T>(`/projects/${id}/submissions`),
  },
};
