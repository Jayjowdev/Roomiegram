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

export async function listarUsuariosAdmin() {
  try {
    const { data } = await usuarioApi.get<UsuarioResumen[]>("/auth/admin/usuarios")
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function obtenerUsuario(id: number) {
  try {
    const { data } = await usuarioApi.get<UsuarioResumen>(`/auth/admin/usuarios/${id}`)
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function suspenderUsuario(id: number, adminId: number, rolSolicitante: string) {
  try {
    const { data } = await usuarioApi.patch<UsuarioResumen>(`/auth/admin/usuarios/${id}/suspender`, null, {
      params: { adminId, rolSolicitante },
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function reactivarUsuario(id: number, adminId: number, rolSolicitante: string) {
  try {
    const { data } = await usuarioApi.patch<UsuarioResumen>(`/auth/admin/usuarios/${id}/reactivar`, null, {
      params: { adminId, rolSolicitante },
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function restablecerContrasenaUsuario(id: number, adminId: number, rolSolicitante: string) {
  try {
    const { data } = await usuarioApi.post<{
      mensaje: string
      contrasenaTemporal: string
      usuario: UsuarioResumen
    }>(`/auth/admin/usuarios/${id}/restablecer-contrasena`, null, {
      params: { adminId, rolSolicitante },
    })
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function eliminarUsuario(id: number, adminId: number, rolSolicitante: string) {
  try {
    await usuarioApi.delete(`/auth/admin/usuarios/${id}`, {
      params: { adminId, rolSolicitante },
    })
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
  listarAdmin: listarUsuariosAdmin,
  obtener: obtenerUsuario,
  suspender: suspenderUsuario,
  reactivar: reactivarUsuario,
  restablecerContrasena: restablecerContrasenaUsuario,
  eliminar: eliminarUsuario,
  enviarCorreoTareaAsignada,
  enviarCorreoTareaCompletada,
  enviarCorreoSolicitudRecibida,
  enviarCorreoSolicitudResuelta,
  enviarContactoSoporte,
}
