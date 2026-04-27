import type { Notificacion } from "../types/Backend";
import { apiUrls, requestJson } from "./api";

export const notificacionService = {
  listar(): Promise<Notificacion[]> {
    return requestJson<Notificacion[]>(`${apiUrls.notificaciones}/notificaciones`);
  },

  crear(notificacion: Notificacion): Promise<Notificacion> {
    return requestJson<Notificacion>(`${apiUrls.notificaciones}/notificaciones`, {
      method: "POST",
      body: JSON.stringify(notificacion),
    });
  },
};
