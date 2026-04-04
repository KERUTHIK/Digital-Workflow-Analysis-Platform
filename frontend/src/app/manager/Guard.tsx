import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ManagerGuard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isManager =
    user?.role === "Manager" || user?.role === "Senior Manager";

  if (!isManager) {
    // Redirect System Admin to their dashboard, others to login
    if (user?.role === "System Admin") return <Navigate to="/" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
