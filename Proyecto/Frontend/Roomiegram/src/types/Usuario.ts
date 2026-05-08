export type UsuarioRole = "ADMIN" | "CLIENTE"

export type UsuarioAuth = {
  id: number
  usuario: string
  nombre: string
  correo: string
  role: UsuarioRole
  fotoPerfil?: string
}

export type RegisterPayload = {
  nombre: string
  correo: string
  telefono: string
  contrasena: string
  usuario: string
}

export type RegisterResponse = {
  id: number
  nombre: string
  correo: string
  usuario: string
  telefono: string
  fotoPerfil?: string
}

export type LoginPayload = {
  usuario: string
  contrasena: string
}
