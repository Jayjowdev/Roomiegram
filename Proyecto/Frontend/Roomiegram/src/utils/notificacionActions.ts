import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";

export type NotificationActionResult = {
  hogar?: Hogar
  message: string
}

export async function aceptarSolicitudIngreso(params: {
  hogarId: number
  solicitanteId: number
  administradorId: number
  notificacionId?: number
  hogarNombre?: string
}) {
  const actualizado = await hogarService.aprobarSolicitud(params.hogarId, params.solicitanteId, {
    administradorId: params.administradorId,
  });

  try {
    await usuarioService.enviarCorreoSolicitudResuelta({
      usuarioSolicitanteId: params.solicitanteId,
      administradorId: params.administradorId,
      hogarNombre: params.hogarNombre || actualizado.nombre,
      aceptada: true,
    });
  } catch {
    // El correo no debe romper la decision sobre la solicitud.
  }

  if (params.notificacionId) {
    await notificacionService.eliminar(params.notificacionId);
  }

  return {
    hogar: actualizado,
    message: "Solicitud aceptada correctamente.",
  } satisfies NotificationActionResult;
}

export async function rechazarSolicitudIngreso(params: {
  hogarId: number
  solicitanteId: number
  administradorId: number
  notificacionId?: number
  hogarNombre?: string
}) {
  const actualizado = await hogarService.rechazarSolicitud(params.hogarId, params.solicitanteId, {
    administradorId: params.administradorId,
  });

  try {
    await usuarioService.enviarCorreoSolicitudResuelta({
      usuarioSolicitanteId: params.solicitanteId,
      administradorId: params.administradorId,
      hogarNombre: params.hogarNombre || actualizado.nombre,
      aceptada: false,
    });
  } catch {
    // El correo no debe romper la decision sobre la solicitud.
  }

  if (params.notificacionId) {
    await notificacionService.eliminar(params.notificacionId);
  }

  return {
    hogar: actualizado,
    message: "Solicitud rechazada.",
  } satisfies NotificationActionResult;
}

export async function aceptarInvitacionHogar(params: {
  hogarId: number
  usuarioId: number
  administradorId: number
  notificacionId?: number
}) {
  try {
    await hogarService.solicitarIngreso(params.hogarId, { usuarioId: params.usuarioId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("Ya tienes una solicitud") && !message.includes("Ya formas parte")) {
      throw error;
    }
  }

  let actualizado: Hogar | undefined;
  try {
    actualizado = await hogarService.aprobarSolicitud(params.hogarId, params.usuarioId, {
      administradorId: params.administradorId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("Ya formas parte")) {
      throw error;
    }
  }

  if (params.notificacionId) {
    await notificacionService.eliminar(params.notificacionId);
  }

  return {
    hogar: actualizado,
    message: "Invitacion aceptada correctamente.",
  } satisfies NotificationActionResult;
}

export async function rechazarInvitacionHogar(params: { notificacionId?: number }) {
  if (params.notificacionId) {
    await notificacionService.eliminar(params.notificacionId);
  }

  return {
    message: "Invitacion rechazada.",
  } satisfies NotificationActionResult;
}
