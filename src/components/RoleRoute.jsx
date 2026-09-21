import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RoleRoute({ roles = [] }) {
  const { user, isAuthenticated, loading } = useSelector((s) => s.auth);
  const location = useLocation();
  if (loading) return <div className="min-h-screen bg-[var(--tp-bg)]" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user?.role)) return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  return <Outlet />;
}

export const dashboardForRole = (user) => {
  if (user?.role === "ADMIN") return "/admin";
  return "/dashboard";
};
