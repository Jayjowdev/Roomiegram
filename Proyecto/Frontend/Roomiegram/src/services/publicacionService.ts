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

export async function actualizarPublicacion(
  id: number,
  payload: CreatePublicacionPayload,
  usuarioSolicitante: string,
  rolSolicitante: string,
) {
  try {
    const { data } = await publicacionApi.put<Publicacion>(`/publicaciones/${id}`, payload, {
      params: {
        usuarioSolicitante,
        rolSolicitante,
      },
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const publicacionService = {
  listar: listarPublicaciones,
  crear: guardarPublicacion,
  crearConHogar: guardarPublicacionConHogar,
  actualizar: actualizarPublicacion,
  eliminar: eliminarPublicacion,
}

export function mapBackendPublicacionToOferta(pub: Publicacion): Publicacion {
  const tipo = pub.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa"

  return {
    ...pub,
    tipo,
    nombre: pub.usuarioCreador || pub.nombre || "RoomieGram",
    titulo: pub.titulo || (tipo === "busco_roomie" ? "Usuario busca roomie" : "Habitacion disponible"),
    precioMensual: tipo === "ofrezco_casa" ? (pub.precioMensual ?? pub.precio ?? 0) : undefined,
    presupuestoMaximo: tipo === "busco_roomie" ? (pub.presupuestoMaximo ?? pub.precio ?? 0) : undefined,
    precio: pub.precio ?? pub.precioMensual ?? 0,
    amenidades: tipo === "ofrezco_casa"
      ? (pub.amenidades ?? [
          `${pub.numeroHabitaciones || 1} habitacion(es)`,
          `${pub.numeroPersonas || 1} cupo(s)`,
          `${pub.numeroBanos || 1} bano(s)`,
        ])
      : undefined,
    imagen: pub.imagen || home1,
    galeria: pub.galeria || [home1],
  }
}
