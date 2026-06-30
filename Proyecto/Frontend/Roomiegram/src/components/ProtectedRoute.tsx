import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserSession } from "../types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireModerator?: boolean;
}

const MODERATOR_ROLES: UserSession["role"][] = ["ADMIN", "COLABORADOR"];

export const ProtectedRoute = ({ children, requireAdmin = false, requireModerator = false }: ProtectedRouteProps) => {
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

  if (requireModerator && user?.role && !MODERATOR_ROLES.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
