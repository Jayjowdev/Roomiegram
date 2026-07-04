export type EstadoVisitaHogar =
  | "PENDIENTE"
  | "ACEPTADA"
  | "RECHAZADA"
  | "PROPUESTA_ALTERNATIVA"
  | "CANCELADA";

export type VisitaHogar = {
  id: number;
  publicacionId: number;
  hogarId: number;
  interesadoId: number;
  anfitrionId: number;
  fechaHoraPropuesta: string;
  fechaHoraAlternativa?: string;
  mensaje?: string;
  mensajeAlternativa?: string;
  respuestaAnfitrion?: string;
  estado: EstadoVisitaHogar;
  fechaCreacion?: string;
  fechaActualizacion?: string;
};

export type CrearVisitaPayload = {
  publicacionId: number;
  hogarId: number;
  interesadoId: number;
  anfitrionId: number;
  fechaHoraPropuesta: string;
  mensaje?: string;
};
