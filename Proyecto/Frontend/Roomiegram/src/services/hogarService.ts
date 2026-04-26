import { apiClients } from './api'
import type { CreateHogarRequest, Hogar, ResourceAssociationRequest } from '../types/domain'

export async function fetchHogares() {
  const response = await apiClients.hogar.get<Hogar[]>('/hogares')
  return response.data
}

export async function createHogar(payload: CreateHogarRequest) {
  const response = await apiClients.hogar.post<Hogar>('/hogares', payload)
  return response.data
}

export async function associateTarea(hogarId: number, payload: ResourceAssociationRequest) {
  const response = await apiClients.hogar.post<Hogar>(`/hogares/${hogarId}/tareas`, payload)
  return response.data
}

export async function associateCuenta(hogarId: number, payload: ResourceAssociationRequest) {
  const response = await apiClients.hogar.post<Hogar>(`/hogares/${hogarId}/cuentas`, payload)
  return response.data
}

export async function associatePublicacion(hogarId: number, payload: ResourceAssociationRequest) {
  const response = await apiClients.hogar.post<Hogar>(`/hogares/${hogarId}/publicaciones`, payload)
  return response.data
}