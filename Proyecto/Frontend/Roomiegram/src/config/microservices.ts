export const microserviceBaseUrls = {
  auth: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8088',
  hogar: import.meta.env.VITE_HOGAR_API_URL ?? 'http://localhost:8084',
  hogarCuenta: import.meta.env.VITE_HOGAR_CUENTA_API_URL ?? 'http://localhost:8084',
  comprobante: import.meta.env.VITE_COMPROBANTE_API_URL ?? 'http://localhost:8082',
  notificacion: import.meta.env.VITE_NOTIFICACION_API_URL ?? 'http://localhost:8085',
  publicacion: import.meta.env.VITE_PUBLICACION_API_URL ?? 'http://localhost:8086',
  tarea: import.meta.env.VITE_TAREA_API_URL ?? 'http://localhost:8087',
} as const

export type MicroserviceName = keyof typeof microserviceBaseUrls