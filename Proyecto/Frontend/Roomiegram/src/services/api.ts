const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const apiUrls = {
  publicaciones:
    import.meta.env.VITE_PUBLICACION_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080",
  tareas:
    import.meta.env.VITE_TAREA_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080",
  hogarCuentas:
    import.meta.env.VITE_HOGAR_CUENTA_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080",
  comprobantes:
    import.meta.env.VITE_COMPROBANTE_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080",
  notificaciones:
    import.meta.env.VITE_NOTIFICACION_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080",
  hogares:
    import.meta.env.VITE_HOGAR_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080",
};

export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = "No se pudo completar la solicitud";
    try {
      const data = await response.json();
      message = typeof data === "string" ? data : data.message || data.mensaje || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
