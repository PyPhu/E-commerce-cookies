import { Navigate, Outlet, redirect } from "react-router";

interface ProtectedRouteProps {
    isAllowed:  boolean;
    redirectPath?: string;
}

export const ProtectedRoute =({
    isAllowed,
    redirectPath = "/login"
}: ProtectedRouteProps) => {
    if (!isAllowed){
        return <Navigate to={redirectPath} replace />;
    }
    return <Outlet  />;
}