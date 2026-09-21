import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
export default function ProtectedRoute() { const { isAuthenticated, loading } = useSelector(s => s.auth); const location = useLocation(); if (loading) return <div className="min-h-screen bg-[#f6f7f2]" />; return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />; }
