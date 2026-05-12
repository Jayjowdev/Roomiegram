import { getApiErrorMessage, usuarioApi } from "../config/api"
import type { AuthResponse, LoginRequest, RegisterRequest, UserSession } from "../types/auth"
import type { LoginPayload, RegisterPayload, RegisterResponse, UsuarioAuth } from "../types/Usuario"

const AUTH_STORAGE_KEY = "roomiegram.session"

export async function login(payload: LoginPayload) {
  try {
    const { data } = await usuarioApi.post<UsuarioAuth>("/auth/login", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload) {
  try {
    const { data } = await usuarioApi.post<RegisterResponse>("/auth/register", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

function normalizeUser(data: UsuarioAuth | RegisterResponse): UserSession {
  return {
    id: data.id,
    usuario: data.usuario,
    nombre: data.nombre,
    correo: data.correo,
    role: "role" in data ? data.role : "CLIENTE",
    fotoPerfil: "fotoPerfil" in data ? data.fotoPerfil : undefined,
    descripcion: "descripcion" in data ? data.descripcion : undefined,
    intereses: "intereses" in data ? data.intereses : undefined,
    estaEnCasa: "estaEnCasa" in data ? data.estaEnCasa : undefined,
    hogarActual: "hogarActual" in data ? data.hogarActual : undefined,
  }
}

function createSession(user: UserSession): AuthResponse {
  return {
    sessionId: `roomiegram-${user.id}-${Date.now()}`,
    user,
  }
}

export const authService = {
  async login(credentials: LoginRequest) {
    const user = await login(credentials)
    return createSession(normalizeUser(user))
  },

  async register(userData: RegisterRequest) {
    const user = await register(userData)
    return createSession(normalizeUser(user))
  },

  async updateProfilePhoto(userId: number, fotoPerfil: string) {
    const { data } = await usuarioApi.put<UsuarioAuth>(`/auth/profile/${userId}/foto`, { fotoPerfil })
    return normalizeUser(data)
  },

  async updateProfile(userId: number, changes: Partial<UserSession>) {
    const { data } = await usuarioApi.put<UsuarioAuth>(`/auth/profile/${userId}`, changes)
    return normalizeUser(data)
  },

  saveSession(sessionId: string, user: UserSession) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ sessionId, user }))
  },

  getSession(): AuthResponse | null {
    const savedSession = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!savedSession) {
      return null
    }

    try {
      return JSON.parse(savedSession) as AuthResponse
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
  },

  removeSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  },

  createDemoSession() {
    return createSession({
      id: 1,
      usuario: "demo",
      nombre: "Usuario demo",
      correo: "demo@roomiegram.cl",
      role: "CLIENTE",
    })
  },
}
