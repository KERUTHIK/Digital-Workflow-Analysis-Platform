import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import WorkflowConfigPage from "./pages/WorkflowConfigPage";
import ManagerPerformancePage from "./pages/ManagerPerformancePage";
import SettingsPage from "./pages/SettingsPage";
import TeamsPage from "./pages/TeamsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Manager module
import ManagerGuard from "./manager/Guard";
import ManagerLayout from "./manager/Layout";
import ManagerDashboard from "./manager/Dashboard";
import ManagerTeamProjects from "./manager/TeamProjects";
import ManagerAnalytics from "./manager/Analytics";
import ManagerSettings from "./manager/Settings";
import MyTeamPage from "./manager/MyTeam";
import TaskReviewPage from "./manager/TaskReview";

// Employee module
import EmployeeGuard from "./employee/Guard";
import EmployeeLayout from "./employee/Layout";
import EmployeeDashboard from "./employee/Dashboard";
import MyProjectsPage from "./employee/MyProjects";
import CreateProjectPage from "./employee/CreateProject";
import ProjectDetailsPage from "./employee/ProjectDetails";
import EmployeeAnalyticsPage from "./employee/Analytics";
import EmployeeSettingsPage from "./employee/Settings";
import MyTasksPage from "./employee/MyTasks";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  // ── Admin Routes ─────────────────────────────────────────────────────────────
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "projects", Component: ProjectsPage },
      { path: "workflows", Component: WorkflowConfigPage },
      { path: "performance", Component: ManagerPerformancePage },
      { path: "teams", Component: TeamsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
  // ── Manager Routes ───────────────────────────────────────────────────────────
  {
    path: "/manager",
    Component: ManagerGuard,
    children: [
      {
        Component: ManagerLayout,
        children: [
          { index: true, Component: ManagerDashboard },
          { path: "team", Component: ManagerTeamProjects },
          { path: "analytics", Component: ManagerAnalytics },
          { path: "settings", Component: ManagerSettings },
          { path: "my-team", Component: MyTeamPage },
          { path: "task-reviews", Component: TaskReviewPage },
        ],
      },
    ],
  },
  // ── Employee Routes ──────────────────────────────────────────────────────────
  {
    path: "/employee",
    Component: EmployeeGuard,
    children: [
      {
        Component: EmployeeLayout,
        children: [
          { index: true, Component: EmployeeDashboard },
          { path: "projects", Component: MyProjectsPage },
          { path: "create", Component: CreateProjectPage },
          { path: "project/:id", Component: ProjectDetailsPage },
          { path: "analytics", Component: EmployeeAnalyticsPage },
          { path: "settings", Component: EmployeeSettingsPage },
          { path: "tasks", Component: MyTasksPage },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
