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

export const tareaService = {
  listar: listarTareas,
  crear: guardarTarea,
}
