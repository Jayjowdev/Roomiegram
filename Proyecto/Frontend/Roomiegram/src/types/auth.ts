export interface UserSession {
  id: number
  usuario: string
  role: string
  mensaje?: string
}

export interface LoginRequest {
  usuario: string
  contrasena: string
}

export interface RegisterRequest {
  nombre: string
  correo: string
  telefono: string
  contrasena: string
  usuario: string
}