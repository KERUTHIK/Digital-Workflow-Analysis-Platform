import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EmployeeGuard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === "Employee") return <Outlet />;

  // Redirect other roles to their own portals
  if (user?.role === "System Admin") return <Navigate to="/" replace />;
  if (user?.role === "Manager" || user?.role === "Senior Manager")
    return <Navigate to="/manager" replace />;

  return <Navigate to="/login" replace />;
}
