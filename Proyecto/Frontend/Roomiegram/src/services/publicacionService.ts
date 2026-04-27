import type { BackendPublicacion, PublicacionRequest } from "../types/Backend";
import { apiUrls, requestJson } from "./api";

export const publicacionService = {
  listar(): Promise<BackendPublicacion[]> {
    return requestJson<BackendPublicacion[]>(`${apiUrls.publicaciones}/publicaciones/listar`);
  },

  crear(publicacion: PublicacionRequest): Promise<BackendPublicacion> {
    return requestJson<BackendPublicacion>(`${apiUrls.publicaciones}/publicaciones/guardar`, {
      method: "POST",
      body: JSON.stringify(publicacion),
    });
  },

  eliminar(id: number, usuarioSolicitante: string, rolSolicitante: string): Promise<string> {
    const params = new URLSearchParams({ usuarioSolicitante, rolSolicitante });
    return requestJson<string>(`${apiUrls.publicaciones}/publicaciones/${id}?${params.toString()}`, {
      method: "DELETE",
    });
  },
};
