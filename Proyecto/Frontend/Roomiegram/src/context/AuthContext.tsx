/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { LoginRequest, RegisterRequest, UserSession } from "../types/Auth";

interface AuthContextType {
  user: UserSession | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = authService.getSession();
    if (savedSession) {
      setSessionId(savedSession.sessionId);
      setUser(savedSession.user);
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      authService.saveSession(response.sessionId, response.user);
      setSessionId(response.sessionId);
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error en login";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      authService.saveSession(response.sessionId, response.user);
      setSessionId(response.sessionId);
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error en registro";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.removeSession();
    setSessionId(null);
    setUser(null);
    setError(null);
  };

  const loginDemo = () => {
    const response = authService.createDemoSession();
    authService.saveSession(response.sessionId, response.user);
    setSessionId(response.sessionId);
    setUser(response.user);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionId,
        isAuthenticated: !!sessionId,
        isLoading,
        error,
        login,
        register,
        loginDemo,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
