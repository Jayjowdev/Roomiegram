import { getApiErrorMessage, notificacionApi } from "../config/api"
import type { Notificacion } from "../types/Backend"

export async function listarNotificaciones() {
  try {
    const { data } = await notificacionApi.get<Notificacion[]>("/notificaciones")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function eliminarNotificacion(id: number) {
  try {
    await notificacionApi.delete(`/notificaciones/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function crearNotificacion(payload: Notificacion) {
  try {
    const { data } = await notificacionApi.post<Notificacion>("/notificaciones", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const notificacionService = {
  listar: listarNotificaciones,
  crear: crearNotificacion,
  eliminar: eliminarNotificacion,
}
