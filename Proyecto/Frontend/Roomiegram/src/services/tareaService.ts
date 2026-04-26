import { apiClients } from './api'
import type { Tarea } from '../types/domain'

export async function fetchTareas() {
  const response = await apiClients.tarea.get<Tarea[]>('/tareas/listar')
  return response.data
}

export async function createTarea(payload: Tarea) {
  const response = await apiClients.tarea.post<Tarea>('/tareas/guardar', payload)
  return response.data
}