export type TipoPublicacion = "busco_roomie" | "ofrezco_casa"

export type Publicacion = {
  id: number
  tipo?: TipoPublicacion
  usuarioCreador?: string
  nombre?: string
  edad?: number
  titulo?: string
  precio?: number
  precioMensual?: number
  ubicacion: string
  descripcion: string
  numeroHabitaciones?: number
  numeroPersonas?: number
  numeroBanos?: number
  intereses?: string[]
  habitos?: string[]
  presupuestoMaximo?: number
  amenidades?: string[]
  imagen?: string
  galeria?: string[]
  origen?: "demo" | "backend" | "demo-local"
}

export type CreatePublicacionPayload = {
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
