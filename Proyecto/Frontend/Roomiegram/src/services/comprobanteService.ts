import { apiClients } from './api'
import type { Comprobante } from '../types/domain'

export async function createComprobante(payload: Comprobante) {
  const response = await apiClients.comprobante.post<Comprobante>('/comprobantes', payload)
  return response.data
}

export async function updateComprobante(id: number, payload: Comprobante) {
  const response = await apiClients.comprobante.put<Comprobante>(`/comprobantes/${id}`, payload)
  return response.data
}

export async function deleteComprobante(id: number) {
  await apiClients.comprobante.delete(`/comprobantes/${id}`)
}