export type Hogar = {
  id: number
  nombre: string
  descripcion: string
  usuarioCreadorId: number
  usuarioAdministradorId: number
  activo: boolean
  fechaCreacion: string
  integrantesIds: number[]
  solicitudesPendientesIds: number[]
  tareasIds: number[]
  hogarCuentaIds: number[]
  comprobanteIds: number[]
  publicacionIds: number[]
}

export type CreateHogarPayload = {
  nombre: string
  descripcion: string
  usuarioCreadorId: number
}
