import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserSession } from "../types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: UserSession["role"][];
}

export const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthReady, isLoading, user } = useAuth();

  if (!isAuthReady || isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles?.length && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
