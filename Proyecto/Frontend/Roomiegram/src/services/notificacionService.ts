import { apiClients } from './api'
import type { Notificacion } from '../types/domain'

export async function fetchNotificaciones() {
  const response = await apiClients.notificacion.get<Notificacion[]>('/notificaciones')
  return response.data
}

export async function fetchNotificacionById(id: number) {
  const response = await apiClients.notificacion.get<Notificacion>(`/notificaciones/${id}`)
  return response.data
}

export async function createNotificacion(payload: Notificacion) {
  const response = await apiClients.notificacion.post<Notificacion>('/notificaciones', payload)
  return response.data
}

export async function deleteNotificacion(id: number) {
  await apiClients.notificacion.delete(`/notificaciones/${id}`)
}