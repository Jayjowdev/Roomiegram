/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { AuthResponse, LoginRequest, RegisterRequest, UserSession } from "../types/auth";

interface AuthContextType {
  user: UserSession | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  loginDemo: () => void;
  updateUser: (changes: Partial<UserSession>) => void;
  updateProfilePhoto: (fotoPerfil: string) => Promise<void>;
  updateProfile: (changes: Partial<UserSession>) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = authService.getSession();
    if (savedSession) {
      setSessionId(savedSession.sessionId);
      setUser(savedSession.user);
    }
    setIsAuthReady(true);
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
      if (response.requiereAprobacion) {
        return response;
      }
      authService.saveSession(response.sessionId, response.user);
      setSessionId(response.sessionId);
      setUser(response.user);
      return response;
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

  const updateUser = (changes: Partial<UserSession>) => {
    setUser((current) => {
      if (!current || !sessionId) return current;
      const updated = { ...current, ...changes };
      authService.saveSession(sessionId, updated);
      return updated;
    });
  };

  const updateProfilePhoto = async (fotoPerfil: string) => {
    if (!user || !sessionId) return;

    try {
      const updated = await authService.updateProfilePhoto(user.id, fotoPerfil);
      authService.saveSession(sessionId, updated);
      setUser(updated);
    } catch {
      updateUser({ fotoPerfil });
    }
  };

  const updateProfile = async (changes: Partial<UserSession>) => {
    if (!user || !sessionId) return;

    try {
      const updated = await authService.updateProfile(user.id, changes);
      const merged = { ...updated, ...changes };
      authService.saveSession(sessionId, merged);
      setUser(merged);
    } catch {
      updateUser(changes);
    }
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
        isAuthReady,
        isLoading,
        error,
        login,
        register,
        loginDemo,
        updateUser,
        updateProfilePhoto,
        updateProfile,
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
