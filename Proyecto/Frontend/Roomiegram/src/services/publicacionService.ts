import { getApiErrorMessage, publicacionApi } from "../config/api"
import home1 from "../assets/home1.svg"
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

export async function guardarPublicacionConHogar(payload: CreatePublicacionPayload & { usuarioId: number }) {
  try {
    const { data } = await publicacionApi.post<{ publicacion: Publicacion; hogarId: number }>(
      "/publicaciones/guardar-con-hogar",
      payload,
    )
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

export const publicacionService = {
  listar: listarPublicaciones,
  crear: guardarPublicacion,
  crearConHogar: guardarPublicacionConHogar,
  eliminar: eliminarPublicacion,
}

export function mapBackendPublicacionToOferta(pub: Publicacion): Publicacion {
  return {
    ...pub,
    tipo: "ofrezco_casa",
    nombre: pub.usuarioCreador || pub.nombre || "RoomieGram",
    titulo: pub.titulo || "Habitacion disponible",
    precioMensual: pub.precioMensual ?? pub.precio ?? 0,
    precio: pub.precio ?? pub.precioMensual ?? 0,
    amenidades: pub.amenidades ?? [
      `${pub.numeroHabitaciones || 1} habitacion(es)`,
      `${pub.numeroPersonas || 1} cupo(s)`,
      `${pub.numeroBanos || 1} bano(s)`,
    ],
    imagen: pub.imagen || home1,
    galeria: pub.galeria || [home1],
  }
}
