import { getApiErrorMessage, hogarApi } from "../config/api";
import type { CrearVisitaPayload, VisitaHogar } from "../types/VisitaHogar";

export async function crearVisita(payload: CrearVisitaPayload) {
  try {
    const { data } = await hogarApi.post<VisitaHogar>("/hogares/visitas", payload);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function listarVisitasPorUsuario(usuarioId: number) {
  try {
    const { data } = await hogarApi.get<VisitaHogar[]>("/hogares/visitas", {
      params: { usuarioId },
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function obtenerVisita(id: number) {
  try {
    const { data } = await hogarApi.get<VisitaHogar>(`/hogares/visitas/${id}`);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function aceptarVisita(id: number, usuarioId: number, mensaje?: string) {
  try {
    const { data } = await hogarApi.post<VisitaHogar>(`/hogares/visitas/${id}/aceptar`, { usuarioId, mensaje });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function rechazarVisita(id: number, usuarioId: number, mensaje?: string) {
  try {
    const { data } = await hogarApi.post<VisitaHogar>(`/hogares/visitas/${id}/rechazar`, { usuarioId, mensaje });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function proponerAlternativaVisita(
  id: number,
  anfitrionId: number,
  fechaHoraAlternativa: string,
  mensaje?: string,
) {
  try {
    const { data } = await hogarApi.post<VisitaHogar>(`/hogares/visitas/${id}/proponer-alternativa`, {
      anfitrionId,
      fechaHoraAlternativa,
      mensaje,
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function responderAlternativaVisita(
  id: number,
  interesadoId: number,
  aceptada: boolean,
  mensaje?: string,
) {
  try {
    const { data } = await hogarApi.post<VisitaHogar>(`/hogares/visitas/${id}/responder-alternativa`, {
      interesadoId,
      aceptada,
      mensaje,
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function cancelarVisita(id: number, usuarioId: number, mensaje?: string) {
  try {
    const { data } = await hogarApi.post<VisitaHogar>(`/hogares/visitas/${id}/cancelar`, { usuarioId, mensaje });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export const visitaService = {
  crear: crearVisita,
  listarPorUsuario: listarVisitasPorUsuario,
  obtener: obtenerVisita,
  aceptar: aceptarVisita,
  rechazar: rechazarVisita,
  proponerAlternativa: proponerAlternativaVisita,
  responderAlternativa: responderAlternativaVisita,
  cancelar: cancelarVisita,
};
