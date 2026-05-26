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

export type PreferenciasCompatibilidad = {
  limpieza: string
  ambiente: string
  horario: string
  mascotas: string
  fumar: string
  presupuesto: string
}

export type UserSession = {
  id: number
  usuario: string
  nombre: string
  correo: string
  telefono?: string
  role: "ADMIN" | "CLIENTE"
  fotoPerfil?: string
  descripcion?: string
  intereses?: string[]
  estaEnCasa?: boolean
  hogarActual?: string
  preferenciasCompatibilidad?: PreferenciasCompatibilidad
}

export type AuthResponse = {
  sessionId: string
  user: UserSession
}
