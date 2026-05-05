export type EstadoNotificacion = string
export type TipoNotificacion = string

export type Notificacion = {
  id: number
  usuarioEmisorId: number
  usuarioReceptorId: number
  hogarId: number | null
  referenciaId: number | null
  tipo: TipoNotificacion
  estado: EstadoNotificacion
  titulo: string
  mensaje: string
  fechaCreacion: string
  fechaActualizacion: string
}
