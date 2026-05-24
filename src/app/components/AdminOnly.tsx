import { Navigate } from "react-router";
import { useAuth } from "./AdminAuth"; 

interface AdminOnlyProps {
  children: React.ReactNode;
}

export function AdminOnly({ children }: AdminOnlyProps) {
  const { isAdmin, loading } = useAuth();

  // load state ขณะตรวจสอบสิทธิ์
  if (loading) {
    return <div className="text-center py-12 text-slate-600 font-medium">Checking access...</div>;
  }

  // if user is not admin, redirect to home page
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}