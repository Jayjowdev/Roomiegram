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

type PreferenciaDetalle = {
  key: keyof PreferenciasCompatibilidad;
  label: string;
  value: string;
};

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

export function getPreferenciasDetalle(preferencias?: Partial<PreferenciasCompatibilidad> | null): PreferenciaDetalle[] {
  if (!preferencias) return [];

  const detalle: PreferenciaDetalle[] = [];

  if (preferencias.limpieza) {
    detalle.push({
      key: "limpieza",
      label: "Limpieza",
      value: preferenciasLabels.limpieza[preferencias.limpieza as keyof typeof preferenciasLabels.limpieza],
    });
  }
  if (preferencias.ambiente) {
    detalle.push({
      key: "ambiente",
      label: "Ambiente",
      value: preferenciasLabels.ambiente[preferencias.ambiente as keyof typeof preferenciasLabels.ambiente],
    });
  }
  if (preferencias.horario) {
    detalle.push({
      key: "horario",
      label: "Horario",
      value: preferenciasLabels.horario[preferencias.horario as keyof typeof preferenciasLabels.horario],
    });
  }
  if (preferencias.mascotas) {
    detalle.push({
      key: "mascotas",
      label: "Mascotas",
      value: preferenciasLabels.mascotas[preferencias.mascotas as keyof typeof preferenciasLabels.mascotas],
    });
  }
  if (preferencias.fumar) {
    detalle.push({
      key: "fumar",
      label: "Fumar",
      value: preferenciasLabels.fumar[preferencias.fumar as keyof typeof preferenciasLabels.fumar],
    });
  }
  if (preferencias.presupuesto && Number(preferencias.presupuesto) > 0) {
    detalle.push({
      key: "presupuesto",
      label: "Presupuesto",
      value: `$${Number(preferencias.presupuesto).toLocaleString("es-CL")} max.`,
    });
  }

  return detalle.filter((item) => Boolean(item.value));
}

export function getPreferenciasDetalleFromValues(values?: Array<string | undefined | null>) {
  if (!values?.length) return [];

  const preferencias: Partial<PreferenciasCompatibilidad> = {};

  values.forEach((value) => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return;

    if (normalized in preferenciasLabels.limpieza) preferencias.limpieza = normalized;
    if (normalized in preferenciasLabels.ambiente) preferencias.ambiente = normalized;
    if (normalized in preferenciasLabels.horario) preferencias.horario = normalized;
    if (normalized in preferenciasLabels.mascotas) preferencias.mascotas = normalized;
    if (normalized in preferenciasLabels.fumar) preferencias.fumar = normalized;
  });

  return getPreferenciasDetalle(preferencias);
}

export function getPreferenciasResumen(preferencias?: PreferenciasCompatibilidad) {
  if (!preferencias) return [];

  return getPreferenciasDetalle(preferencias).map((preferencia) => preferencia.value);
}
