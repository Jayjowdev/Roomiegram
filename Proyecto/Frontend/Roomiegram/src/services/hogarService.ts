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

export async function eliminarHogar(id: number, administradorId: number) {
  try {
    await hogarApi.delete(`/hogares/${id}`, {
      params: { administradorId },
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const hogarService = {
  listar: listarHogares,
  crear: crearHogar,
  solicitarIngreso: (hogarId: number, payload: { usuarioId: number }) =>
    hogarApi
      .post(`/hogares/${hogarId}/solicitudes`, payload)
      .then(({ data }) => data),
  aprobarSolicitud: (hogarId: number, usuarioId: number, payload: { administradorId: number }) =>
    hogarApi
      .post(`/hogares/${hogarId}/solicitudes/${usuarioId}/aprobar`, payload)
      .then(({ data }) => data),
  rechazarSolicitud: (hogarId: number, usuarioId: number, payload: { administradorId: number }) =>
    hogarApi
      .post(`/hogares/${hogarId}/solicitudes/${usuarioId}/rechazar`, payload)
      .then(({ data }) => data),
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
  eliminar: eliminarHogar,
}
