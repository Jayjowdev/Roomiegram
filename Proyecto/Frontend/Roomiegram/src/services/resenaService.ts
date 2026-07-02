import { getApiErrorMessage, usuarioApi } from "../config/api"
import type { ResenaRoomie } from "../types/Backend"

export async function listarResenasUsuario(usuarioId: number) {
  try {
    const { data } = await usuarioApi.get<ResenaRoomie[]>(`/auth/resenas/usuario/${usuarioId}`)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function crearResena(payload: ResenaRoomie) {
  try {
    const { data } = await usuarioApi.post<ResenaRoomie>("/auth/resenas", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const resenaService = {
  listarPorUsuario: listarResenasUsuario,
  crear: crearResena,
}
