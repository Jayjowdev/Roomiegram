export type Tarea = {
  id: number
  titulo: string
  encargado: string
  descripcion: string
  fecha: string
  completada?: boolean | null
}

export type CreateTareaPayload = {
  titulo: string
  encargado: string
  descripcion: string
  fecha: string
}
