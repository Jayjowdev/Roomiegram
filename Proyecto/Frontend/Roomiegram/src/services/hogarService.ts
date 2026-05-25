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
    const { data } = await hogarApi.post<Hogar>(`/hogares/${hogarId}/solicitudes`, { usuarioId })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function aprobarSolicitudHogar(hogarId: number, usuarioId: number, administradorId: number) {
  try {
    const { data } = await hogarApi.post<Hogar>(`/hogares/${hogarId}/solicitudes/${usuarioId}/aprobar`, {
      administradorId,
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function rechazarSolicitudHogar(hogarId: number, usuarioId: number, administradorId: number) {
  try {
    const { data } = await hogarApi.post<Hogar>(`/hogares/${hogarId}/solicitudes/${usuarioId}/rechazar`, {
      administradorId,
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function eliminarHogar(id: number, administradorId: number) {
  try {
    await hogarApi.delete(`/hogares/${id}`, {
      params: { administradorId },
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function agregarPublicacionHogar(hogarId: number, administradorId: number, recursoId: number) {
  try {
    const { data } = await hogarApi.post<Hogar>(`/hogares/${hogarId}/publicaciones`, {
      administradorId,
      recursoId,
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const hogarService = {
  listar: listarHogares,
  crear: crearHogar,
  solicitarIngreso: (hogarId: number, payload: { usuarioId: number }) =>
    solicitarIngresoHogar(hogarId, payload.usuarioId),
  aprobarSolicitud: (hogarId: number, usuarioId: number, payload: { administradorId: number }) =>
    aprobarSolicitudHogar(hogarId, usuarioId, payload.administradorId),
  rechazarSolicitud: (hogarId: number, usuarioId: number, payload: { administradorId: number }) =>
    rechazarSolicitudHogar(hogarId, usuarioId, payload.administradorId),
  agregarTarea: (hogarId: number, payload: { administradorId: number; recursoId: number }) =>
    hogarApi
      .post(`/hogares/${hogarId}/tareas`, payload)
      .then(({ data }) => data),
  agregarCuenta: (hogarId: number, payload: { administradorId: number; recursoId: number }) =>
    hogarApi
      .post(`/hogares/${hogarId}/cuentas`, payload)
      .then(({ data }) => data),
  agregarComprobante: (hogarId: number, payload: { administradorId: number; recursoId: number }) =>
    hogarApi
      .post(`/hogares/${hogarId}/comprobantes`, payload)
      .then(({ data }) => data),
  agregarPublicacion: agregarPublicacionHogar,
  eliminar: eliminarHogar,
}
