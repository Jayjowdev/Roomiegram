import { getApiErrorMessage, usuarioApi } from "../config/api"
import type { UsuarioResumen } from "../types/Usuario"

export async function listarUsuarios() {
  try {
    const { data } = await usuarioApi.get<UsuarioResumen[]>("/auth/usuarios")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const usuarioService = {
  listar: listarUsuarios,
}
