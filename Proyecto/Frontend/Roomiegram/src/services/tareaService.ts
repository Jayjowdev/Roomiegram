import { getApiErrorMessage, tareaApi } from "../config/api"
import type { CreateTareaPayload, Tarea } from "../types/Tarea"

export async function listarTareas() {
  try {
    const { data } = await tareaApi.get<Tarea[]>("/tareas/listar")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function guardarTarea(payload: CreateTareaPayload) {
  try {
    const { data } = await tareaApi.post<Tarea>("/tareas/guardar", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function actualizarTarea(id: number, payload: CreateTareaPayload) {
  try {
    const { data } = await tareaApi.put<Tarea>(`/tareas/${id}`, payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function completarTarea(id: number) {
  try {
    const { data } = await tareaApi.patch<Tarea>(`/tareas/${id}/completar`)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function marcarTareaPendiente(id: number) {
  try {
    const { data } = await tareaApi.patch<Tarea>(`/tareas/${id}/pendiente`)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const tareaService = {
  listar: listarTareas,
  crear: guardarTarea,
  actualizar: actualizarTarea,
  completar: completarTarea,
  pendiente: marcarTareaPendiente,
}
