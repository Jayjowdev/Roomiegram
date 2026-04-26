import axios from 'axios'

const fallbackUrls = {
  auth: 'http://localhost:8088',
  hogar: 'http://localhost:8080',
  publicacion: 'http://localhost:8081',
  tarea: 'http://localhost:8082',
  hogarCuenta: 'http://localhost:8083',
} as const

export const apiClients = {
  auth: axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL ?? fallbackUrls.auth,
    headers: { 'Content-Type': 'application/json' },
  }),
  hogar: axios.create({
    baseURL: import.meta.env.VITE_HOGAR_API_URL ?? fallbackUrls.hogar,
    headers: { 'Content-Type': 'application/json' },
  }),
  publicacion: axios.create({
    baseURL: import.meta.env.VITE_PUBLICACION_API_URL ?? fallbackUrls.publicacion,
    headers: { 'Content-Type': 'application/json' },
  }),
  tarea: axios.create({
    baseURL: import.meta.env.VITE_TAREA_API_URL ?? fallbackUrls.tarea,
    headers: { 'Content-Type': 'application/json' },
  }),
  hogarCuenta: axios.create({
    baseURL: import.meta.env.VITE_HOGAR_CUENTA_API_URL ?? fallbackUrls.hogarCuenta,
    headers: { 'Content-Type': 'application/json' },
  }),
}

export function resolveApiError(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === 'string') {
      return error.response.data
    }

    if (typeof error.response?.data?.mensaje === 'string') {
      return error.response.data.mensaje
    }
  }

  return fallbackMessage
}