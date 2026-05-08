import { getApiErrorMessage, comprobanteApi } from "../config/api"
import type { Comprobante } from "../types/Backend"
import type { CreateComprobantePayload } from "../types/Comprobante"

export async function crearComprobante(payload: CreateComprobantePayload) {
  try {
    const { data } = await comprobanteApi.post<Comprobante>("/comprobantes", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function eliminarComprobante(id: number) {
  try {
    await comprobanteApi.delete(`/comprobantes/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const comprobanteService = {
  crear: (payload: Comprobante) => crearComprobante(payload as CreateComprobantePayload) as Promise<Comprobante>,
  eliminar: eliminarComprobante,
}
