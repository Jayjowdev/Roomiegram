export type TipoPublicacion = "busco_roomie" | "ofrezco_casa"

export type Publicacion = {
  id: number
  tipo?: TipoPublicacion
  usuarioId?: number
  usuarioCreador?: string
  nombre?: string
  edad?: number
  titulo?: string
  precio?: number
  precioMensual?: number
  ubicacion: string
  descripcion: string
  telefono?: string
  correo?: string
  numeroHabitaciones?: number
  numeroPersonas?: number
  numeroBanos?: number
  intereses?: string[]
  habitos?: string[]
  presupuestoMaximo?: number
  amenidades?: string[]
  imagen?: string
  galeria?: string[]
  origen?: "backend" | "local"
  estadoModeracion?: "ACTIVA" | "OCULTA_MODERACION" | string
  motivoModeracion?: string
  moderadoPorId?: number
  fechaModeracion?: string
}

export type CreatePublicacionPayload = {
  tipo?: TipoPublicacion
  usuarioCreador: string
  titulo: string
  precio: number
  ubicacion: string
  descripcion: string
  numeroHabitaciones: number
  numeroPersonas: number
  numeroBanos: number
  imagen?: string
  galeria?: string[]
}
