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

export async function enviarCorreoTareaAsignada(payload: {
  usuarioId: number
  titulo: string
  descripcion: string
  fecha: string
  hogarNombre?: string
  asignadorNombre?: string
}) {
  try {
    const { data } = await usuarioApi.post<{ enviado: boolean; mensaje: string }>("/auth/emails/task-assignment", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function enviarCorreoTareaCompletada(payload: {
  usuarioReceptorId: number
  usuarioCompletadorId: number
  titulo: string
  descripcion: string
  fecha: string
  hogarNombre?: string
}) {
  try {
    const { data } = await usuarioApi.post<{ enviado: boolean; mensaje: string }>("/auth/emails/task-completed", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function enviarCorreoSolicitudRecibida(payload: {
  usuarioReceptorId: number
  usuarioSolicitanteId: number
  solicitanteNombre?: string
  hogarNombre?: string
  publicacionTitulo?: string
}) {
  try {
    const { data } = await usuarioApi.post<{ enviado: boolean; mensaje: string }>("/auth/emails/solicitud-recibida", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function enviarCorreoSolicitudResuelta(payload: {
  usuarioSolicitanteId: number
  administradorId: number
  hogarNombre?: string
  aceptada: boolean
}) {
  try {
    const { data } = await usuarioApi.post<{ enviado: boolean; mensaje: string }>("/auth/emails/solicitud-resuelta", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function enviarContactoSoporte(payload: {
  asunto: string
  mensaje: string
  correo: string
  nombre?: string
  usuario?: string
}) {
  try {
    const { data } = await usuarioApi.post<{ enviado: boolean; mensaje: string }>("/auth/emails/support", payload)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export const usuarioService = {
  listar: listarUsuarios,
  enviarCorreoTareaAsignada,
  enviarCorreoTareaCompletada,
  enviarCorreoSolicitudRecibida,
  enviarCorreoSolicitudResuelta,
  enviarContactoSoporte,
}
