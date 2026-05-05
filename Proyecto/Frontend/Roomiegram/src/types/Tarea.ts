export type Tarea = {
  id: number
  titulo: string
  encargado: string
  descripcion: string
  fecha: string
}

export type CreateTareaPayload = {
  titulo: string
  encargado: string
  descripcion: string
  fecha: string
}
