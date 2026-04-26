import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { UserSession } from '../types/auth'

interface AuthContextValue {
  user: UserSession | null
  login: (session: UserSession) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AUTH_STORAGE_KEY = 'roomiegram_user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem(AUTH_STORAGE_KEY)
    return savedSession ? (JSON.parse(savedSession) as UserSession) : null
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (session) => {
        setUser(session)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      },
      logout: () => {
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      },
      isAuthenticated: user !== null,
      isAdmin: user?.role?.toUpperCase() === 'ADMIN',
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}