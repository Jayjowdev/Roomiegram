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
    sin_mascotas: "Prefiere sin mascotas",
    mascotas: "Acepta mascotas",
    indiferente_mascotas: "No tengo problema con mascotas",
  },
  fumar: {
    no_fuma: "No fumador",
    fuma: "Fumador",
    indiferente_fuma: "Me da igual",
  },
};

export type MascotasPreferencia = keyof typeof preferenciasLabels.mascotas;

export function getMascotasPreferenceValue(value?: string | null): MascotasPreferencia | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "mascotas" || normalized === "sin_mascotas" || normalized === "indiferente_mascotas") {
    return normalized;
  }
  return null;
}

export function getMascotasPreferenceFromValues(values?: Array<string | undefined | null>) {
  return values?.map(getMascotasPreferenceValue).find((value): value is MascotasPreferencia => Boolean(value)) || null;
}

export function getMascotasPreferenceLabel(value?: string | null) {
  const preference = getMascotasPreferenceValue(value);
  return preference ? preferenciasLabels.mascotas[preference] : "";
}

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
