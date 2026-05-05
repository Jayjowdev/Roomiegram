import { getApiErrorMessage, publicacionApi } from "../config/api"
import type { CreatePublicacionPayload, Publicacion } from "../types/Publicacion"

export async function listarPublicaciones() {
  try {
    const { data } = await publicacionApi.get<Publicacion[]>("/publicaciones/listar")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function guardarPublicacion(payload: CreatePublicacionPayload) {
  try {
    const { data } = await publicacionApi.post<Publicacion>("/publicaciones/guardar", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function eliminarPublicacion(id: number, usuarioSolicitante: string, rolSolicitante: string) {
  try {
    await publicacionApi.delete(`/publicaciones/${id}`, {
      params: {
        usuarioSolicitante,
        rolSolicitante,
      },
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
