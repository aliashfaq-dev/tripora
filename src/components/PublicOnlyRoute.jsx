import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { dashboardForRole } from "./RoleRoute";

export default function PublicOnlyRoute() {
  const { isAuthenticated, user, loading } = useSelector(s => s.auth);
  if (loading) return <div className="min-h-screen bg-[#f6f7f2]" />;
  return isAuthenticated ? <Navigate to={dashboardForRole(user)} replace /> : <Outlet />;
}
