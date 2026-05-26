import type { PreferenciasCompatibilidad } from "../types/auth";

export const preferenciasIniciales: PreferenciasCompatibilidad = {
  limpieza: "ordenado",
  ambiente: "tranquilo",
  horario: "madrugador",
  mascotas: "sin_mascotas",
  fumar: "no_fuma",
  presupuesto: "280000",
};

export const preferenciasLabels = {
  limpieza: {
    ordenado: "Muy ordenado",
    intermedio: "Orden intermedio",
    relajado: "Relajado",
  },
  ambiente: {
    tranquilo: "Ambiente tranquilo",
    social: "Social",
    fiestas: "Fiestas ocasionales",
  },
  horario: {
    madrugador: "Madrugador",
    nocturno: "Nocturno",
    flexible: "Flexible",
  },
  mascotas: {
    sin_mascotas: "Sin mascotas",
    mascotas: "Pet-friendly",
    indiferente_mascotas: "Me da igual",
  },
  fumar: {
    no_fuma: "No fumador",
    fuma: "Fumador",
    indiferente_fuma: "Me da igual",
  },
};

export function getPreferenciasResumen(preferencias?: PreferenciasCompatibilidad) {
  if (!preferencias) return [];

  return [
    preferenciasLabels.limpieza[preferencias.limpieza as keyof typeof preferenciasLabels.limpieza],
    preferenciasLabels.ambiente[preferencias.ambiente as keyof typeof preferenciasLabels.ambiente],
    preferenciasLabels.horario[preferencias.horario as keyof typeof preferenciasLabels.horario],
    preferenciasLabels.mascotas[preferencias.mascotas as keyof typeof preferenciasLabels.mascotas],
    preferenciasLabels.fumar[preferencias.fumar as keyof typeof preferenciasLabels.fumar],
    `$${Number(preferencias.presupuesto || 0).toLocaleString("es-CL")} max.`,
  ].filter(Boolean);
}
