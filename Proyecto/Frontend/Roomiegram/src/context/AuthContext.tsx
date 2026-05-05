import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { UsuarioAuth } from "../types/Usuario"

const AUTH_STORAGE_KEY = "roomiegram.auth"

type AuthContextValue = {
  user: UsuarioAuth | null
  isAuthenticated: boolean
  login: (nextUser: UsuarioAuth) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser() {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as UsuarioAuth
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAuth | null>(() => readStoredUser())

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      return
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: (nextUser: UsuarioAuth) => setUser(nextUser),
      logout: () => setUser(null),
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }

  return context
}
