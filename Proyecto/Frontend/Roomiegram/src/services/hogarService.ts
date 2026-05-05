import { getApiErrorMessage, hogarApi } from "../config/api"
import type { CreateHogarPayload, Hogar } from "../types/Hogar"

export async function listarHogares() {
  try {
    const { data } = await hogarApi.get<Hogar[]>("/hogares")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function crearHogar(payload: CreateHogarPayload) {
  try {
    const { data } = await hogarApi.post<Hogar>("/hogares", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function solicitarIngresoHogar(hogarId: number, usuarioId: number) {
  try {
    await hogarApi.post(`/hogares/${hogarId}/solicitudes`, { usuarioId })
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
