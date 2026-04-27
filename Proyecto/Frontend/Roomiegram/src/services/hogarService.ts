import type { CreateHogarRequest, Hogar, UsuarioRequest } from "../types/Backend";
import { apiUrls, requestJson } from "./api";

export const hogarService = {
  listar(): Promise<Hogar[]> {
    return requestJson<Hogar[]>(`${apiUrls.hogares}/hogares`);
  },

  crear(hogar: CreateHogarRequest): Promise<Hogar> {
    return requestJson<Hogar>(`${apiUrls.hogares}/hogares`, {
      method: "POST",
      body: JSON.stringify(hogar),
    });
  },

  solicitarIngreso(hogarId: number, request: UsuarioRequest): Promise<Hogar> {
    return requestJson<Hogar>(`${apiUrls.hogares}/hogares/${hogarId}/solicitudes`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  aprobarSolicitud(hogarId: number, usuarioId: number, administradorId: number): Promise<Hogar> {
    return requestJson<Hogar>(`${apiUrls.hogares}/hogares/${hogarId}/solicitudes/${usuarioId}/aprobar`, {
      method: "POST",
      body: JSON.stringify({ administradorId }),
    });
  },

  rechazarSolicitud(hogarId: number, usuarioId: number, administradorId: number): Promise<Hogar> {
    return requestJson<Hogar>(`${apiUrls.hogares}/hogares/${hogarId}/solicitudes/${usuarioId}/rechazar`, {
      method: "POST",
      body: JSON.stringify({ administradorId }),
    });
  },

  eliminar(hogarId: number, administradorId: number): Promise<void> {
    return requestJson<void>(`${apiUrls.hogares}/hogares/${hogarId}?administradorId=${administradorId}`, {
      method: "DELETE",
    });
  },
};
