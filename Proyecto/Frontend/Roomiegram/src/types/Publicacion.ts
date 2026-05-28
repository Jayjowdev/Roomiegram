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
}

export type CreatePublicacionPayload = {
  tipo?: TipoPublicacion
  usuarioId?: number
  usuarioCreador: string
  nombre?: string
  telefono?: string
  correo?: string
  titulo: string
  precio: number
  presupuestoMaximo?: number
  ubicacion: string
  descripcion: string
  numeroHabitaciones: number
  numeroPersonas: number
  numeroBanos: number
  imagen?: string
  galeria?: string[]
}
