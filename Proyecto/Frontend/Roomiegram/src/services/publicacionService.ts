import { getApiErrorMessage, publicacionApi } from "../config/api"
import home1 from "../assets/home1.svg"
import type { CreatePublicacionPayload, Publicacion } from "../types/Publicacion"

export type Historia = {
  id: number
  titulo: string
  mensaje: string
  nombreVisible: string
  usuarioCreador?: string
  fechaCreacion?: string
}

export type HistoriaPayload = {
  titulo: string
  mensaje: string
  nombreVisible: string
  usuarioCreador?: string
}

export async function listarPublicaciones() {
  try {
    const { data } = await publicacionApi.get<Publicacion[]>("/publicaciones/listar")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function listarPublicacionesModeracion(moderadorId: number) {
  try {
    const { data } = await publicacionApi.get<Publicacion[]>("/publicaciones/moderacion", {
      params: { moderadorId },
    })
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

export async function ocultarPublicacion(id: number, payload: { moderadorId: number; motivo: string }) {
  try {
    const { data } = await publicacionApi.patch<Publicacion>(`/publicaciones/${id}/moderacion/ocultar`, payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function restaurarPublicacion(id: number, payload: { moderadorId: number; motivo: string }) {
  try {
    const { data } = await publicacionApi.patch<Publicacion>(`/publicaciones/${id}/moderacion/restaurar`, payload)
    return data
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

export async function listarHistorias() {
  try {
    const { data } = await publicacionApi.get<Historia[]>("/publicaciones/historias")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function crearHistoria(payload: HistoriaPayload) {
  try {
    const { data } = await publicacionApi.post<Historia>("/publicaciones/historias", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function actualizarHistoria(
  id: number,
  payload: HistoriaPayload,
  usuarioSolicitante: string,
  rolSolicitante: string,
) {
  try {
    const { data } = await publicacionApi.put<Historia>(`/publicaciones/historias/${id}`, payload, {
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

export async function eliminarHistoria(id: number, usuarioSolicitante: string, rolSolicitante: string) {
  try {
    await publicacionApi.delete(`/publicaciones/historias/${id}`, {
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
  listarModeracion: listarPublicacionesModeracion,
  crear: guardarPublicacion,
  crearConHogar: guardarPublicacionConHogar,
  actualizar: actualizarPublicacion,
  eliminar: eliminarPublicacion,
  ocultar: ocultarPublicacion,
  restaurar: restaurarPublicacion,
  listarHistorias,
  crearHistoria,
  actualizarHistoria,
  eliminarHistoria,
}

export function mapBackendPublicacionToOferta(pub: Publicacion): Publicacion {
  const tipo = pub.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa"

  return {
    ...pub,
    tipo,
    nombre: pub.usuarioCreador || pub.nombre || "RoomieGram",
    titulo: pub.titulo || (tipo === "busco_roomie" ? "Usuario busca roomie" : "Habitación disponible"),
    precioMensual: tipo === "ofrezco_casa" ? (pub.precioMensual ?? pub.precio ?? 0) : undefined,
    presupuestoMaximo: tipo === "busco_roomie" ? (pub.presupuestoMaximo ?? pub.precio ?? 0) : undefined,
    precio: pub.precio ?? pub.precioMensual ?? 0,
    amenidades: tipo === "ofrezco_casa"
      ? (pub.amenidades ?? [
          `${pub.numeroHabitaciones || 1} habitación(es)`,
          `${pub.numeroPersonas || 1} cupo(s)`,
          `${pub.numeroBanos || 1} baño(s)`,
        ])
      : undefined,
    imagen: pub.imagen || home1,
    galeria: pub.galeria || [home1],
  }
}
