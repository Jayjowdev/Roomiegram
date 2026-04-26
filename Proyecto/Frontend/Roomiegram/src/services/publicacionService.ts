import { apiClients } from './api'
import type { Publicacion } from '../types/domain'

export async function fetchPublicaciones() {
  const response = await apiClients.publicacion.get<Publicacion[]>('/publicaciones/listar')
  return response.data
}

export async function createPublicacion(payload: Publicacion) {
  const response = await apiClients.publicacion.post<Publicacion>('/publicaciones/guardar', payload)
  return response.data
}