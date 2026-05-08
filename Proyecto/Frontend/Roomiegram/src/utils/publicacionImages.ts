const STORAGE_KEY = "roomiegram-publicacion-imagenes";

type ImageStore = Record<string, string>;

function readStore(): ImageStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as ImageStore;
  } catch {
    return {};
  }
}

export function getPublicacionImage(id?: number | string): string | undefined {
  if (id === undefined || id === null) return undefined;
  return readStore()[String(id)];
}

export function savePublicacionImage(id: number | string, image: string) {
  const store = readStore();
  store[String(id)] = image;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
