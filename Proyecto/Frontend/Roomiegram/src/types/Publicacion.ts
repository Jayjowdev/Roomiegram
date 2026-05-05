export type Publicacion = {
  id: number
  usuarioCreador: string
  titulo: string
  precio: number
  ubicacion: string
  descripcion: string
  numeroHabitaciones: number
  numeroPersonas: number
  numeroBanos: number
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
}