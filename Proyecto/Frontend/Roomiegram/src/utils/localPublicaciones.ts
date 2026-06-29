import type { Publicacion } from "../types/Publicacion";

const STORAGE_KEY = "roomiegram-publicaciones-locales";
const GENERATED_PROFILE_TITLE = /^perfil de\s+/i;
const GENERATED_PROFILE_DESCRIPTION = "usuario registrado con preferencias de convivencia";

export function isGeneratedProfile(publicacion: Publicacion) {
  const descripcion = publicacion.descripcion?.trim().toLowerCase() || "";
  const ubicacion = publicacion.ubicacion?.trim().toLowerCase() || "";

  return (
    publicacion.tipo === "busco_roomie" &&
    (
      GENERATED_PROFILE_TITLE.test(publicacion.titulo || "") ||
      descripcion === GENERATED_PROFILE_DESCRIPTION ||
      ubicacion === "ubicacion no informada"
    )
  );
}

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
