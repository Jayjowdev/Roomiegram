import { getApiErrorMessage, usuarioApi } from "../config/api"
import type { LoginPayload, RegisterPayload, RegisterResponse, UsuarioAuth } from "../types/Usuario"

export async function login(payload: LoginPayload) {
  try {
    const { data } = await usuarioApi.post<UsuarioAuth>("/auth/login", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload) {
  try {
    const { data } = await usuarioApi.post<RegisterResponse>("/auth/register", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
