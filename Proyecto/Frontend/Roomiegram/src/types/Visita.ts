export type EstadoVisita = "PENDIENTE" | "REALIZADA" | "CANCELADA"

export type Visita = {
  id: number
  hogarId: number
  usuarioVisitanteId: number
  fechaVisita: string
  estado: EstadoVisita
  comentarios: string | null
  fechaCreacion: string
}

export type CrearVisitaPayload = {
  usuarioVisitanteId: number
  fechaVisita: string
  comentarios?: string
}

export type ActualizarVisitaPayload = {
  estado: EstadoVisita
  comentarios?: string
  administradorId: number
}
