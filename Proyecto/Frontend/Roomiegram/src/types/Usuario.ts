export type UsuarioRole = "ADMIN" | "CLIENTE" | "COLABORADOR"

export type UsuarioAuth = {
  id: number
  usuario: string
  nombre: string
  correo: string
  telefono: string
  role: UsuarioRole
  fotoPerfil?: string
  descripcion?: string
  intereses?: string[]
  estaEnCasa?: boolean
  hogarActual?: string
  preferenciasCompatibilidad?: {
    limpieza: string
    ambiente: string
    horario: string
    mascotas: string
    fumar: string
    presupuesto: string
  }
}

export type UsuarioResumen = {
  id: number
  usuario: string
  nombre: string
  correo?: string
  telefono: string
  rol?: UsuarioRole
  role?: UsuarioRole
  cuentaActiva?: boolean
  estadoCuenta?: string
  aprobado?: boolean
  fotoPerfil?: string
  descripcion?: string
  intereses?: string[]
  estaEnCasa?: boolean
  hogarActual?: string
  preferenciasCompatibilidad?: {
    limpieza: string
    ambiente: string
    horario: string
    mascotas: string
    fumar: string
    presupuesto: string
  }
}

export type RegisterPayload = {
  nombre: string
  correo: string
  telefono: string
  contrasena: string
  usuario: string
  role?: UsuarioRole
}

export type RegisterResponse = {
  id: number
  nombre: string
  correo: string
  usuario: string
  telefono: string
  role?: UsuarioRole
  requiereAprobacion?: boolean
  mensaje?: string
  cuentaActiva?: boolean
  aprobado?: boolean
  fotoPerfil?: string
  descripcion?: string
  intereses?: string[]
  estaEnCasa?: boolean
  hogarActual?: string
  preferenciasCompatibilidad?: {
    limpieza: string
    ambiente: string
    horario: string
    mascotas: string
    fumar: string
    presupuesto: string
  }
}

export type LoginPayload = {
  usuario: string
  contrasena: string
}
