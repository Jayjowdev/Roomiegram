export type LoginRequest = {
  usuario: string
  contrasena: string
}

export type RegisterRequest = {
  nombre: string
  correo: string
  telefono: string
  contrasena: string
  usuario: string
}

export type UserSession = {
  id: number
  usuario: string
  nombre: string
  correo: string
  role: "ADMIN" | "CLIENTE"
}

export type AuthResponse = {
  sessionId: string
  user: UserSession
}
