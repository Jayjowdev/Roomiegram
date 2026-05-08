import type { Publicacion } from "../types/Publicacion";

const STORAGE_KEY = "roomiegram-publicaciones-locales";

export function getLocalPublicaciones(): Publicacion[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Publicacion[];
  } catch {
    return [];
  }
}

export function saveLocalPublicacion(publicacion: Publicacion) {
  const actuales = getLocalPublicaciones();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([publicacion, ...actuales.filter((pub) => pub.id !== publicacion.id)]));
}

export function deleteLocalPublicacion(id: number) {
  const actuales = getLocalPublicaciones();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actuales.filter((pub) => pub.id !== id)));
}
