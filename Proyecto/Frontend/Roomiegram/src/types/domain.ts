export interface Publicacion {
  id?: number
  usuarioCreador: string
  titulo: string
  ubicacion: string
  descripcion: string
  precio: number
  numeroHabitaciones: number
  numeroPersonas: number
  numeroBanos: number
}

export interface Tarea {
  id?: number
  titulo: string
  encargado: string
  descripcion: string
  fecha: string
}

export interface CuentaDeudor {
  id?: number
  usuarioId: number
  montoAdeudado?: number
}

export interface HogarCuenta {
  id?: number
  descripcion: string
  monto: number
  deudores: CuentaDeudor[]
}

export interface Hogar {
  id?: number
  nombre: string
  descripcion?: string | null
  usuarioCreadorId: number
  usuarioAdministradorId: number
  activo: boolean
  fechaCreacion?: string
  integrantesIds: number[]
  solicitudesPendientesIds: number[]
  tareasIds: number[]
  hogarCuentaIds: number[]
  comprobanteIds: number[]
  publicacionIds: number[]
}

export interface CreateHogarRequest {
  nombre: string
  descripcion: string
  usuarioCreadorId: number
}

export interface ResourceAssociationRequest {
  administradorId: number
  recursoId: number
}