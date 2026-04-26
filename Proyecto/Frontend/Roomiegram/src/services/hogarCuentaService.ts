import { apiClients } from './api'
import type { HogarCuenta } from '../types/domain'

export async function fetchHogarCuentas() {
  const response = await apiClients.hogarCuenta.get<HogarCuenta[]>('/hogar-cuentas')
  return response.data
}

export async function createHogarCuenta(payload: HogarCuenta) {
  const response = await apiClients.hogarCuenta.post<HogarCuenta>('/hogar-cuentas', payload)
  return response.data
}