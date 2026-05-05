import { getApiErrorMessage, hogarCuentaApi } from "../config/api"
import type { CreateHogarCuentaPayload, HogarCuenta } from "../types/HogarCuenta"

export async function listarHogarCuentas() {
  try {
    const { data } = await hogarCuentaApi.get<HogarCuenta[]>("/hogar-cuentas")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function crearHogarCuenta(payload: CreateHogarCuentaPayload) {
  try {
    const { data } = await hogarCuentaApi.post<HogarCuenta>("/hogar-cuentas", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function eliminarHogarCuenta(id: number) {
  try {
    await hogarCuentaApi.delete(`/hogar-cuentas/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
