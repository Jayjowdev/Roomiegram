import axios from "axios"
import type { AxiosError } from "axios"

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

const SERVICE_PORTS = {
  usuario: 8088,
  hogar: 8083,
  hogarCuenta: 8084,
  comprobante: 8082,
  publicacion: 8086,
  tarea: 8087,
  notificacion: 8085,
} as const

function readEnv(value?: string) {
  return value?.trim() || undefined
}

function buildServiceUrl(port: number) {
  const apiBaseUrl = readEnv(import.meta.env.VITE_API_BASE_URL) ?? "http://localhost"
  return `${apiBaseUrl.replace(/\/+$/, "")}:${port}`
}

const API_URLS = {
  usuario: readEnv(import.meta.env.VITE_USUARIO_API_URL) ?? buildServiceUrl(SERVICE_PORTS.usuario),
  hogar: readEnv(import.meta.env.VITE_HOGAR_API_URL) ?? buildServiceUrl(SERVICE_PORTS.hogar),
  hogarCuenta: readEnv(import.meta.env.VITE_HOGAR_CUENTA_API_URL) ?? buildServiceUrl(SERVICE_PORTS.hogarCuenta),
  comprobante: readEnv(import.meta.env.VITE_COMPROBANTE_API_URL) ?? buildServiceUrl(SERVICE_PORTS.comprobante),
  publicacion: readEnv(import.meta.env.VITE_PUBLICACION_API_URL) ?? buildServiceUrl(SERVICE_PORTS.publicacion),
  tarea: readEnv(import.meta.env.VITE_TAREA_API_URL) ?? buildServiceUrl(SERVICE_PORTS.tarea),
  notificacion: readEnv(import.meta.env.VITE_NOTIFICACION_API_URL) ?? buildServiceUrl(SERVICE_PORTS.notificacion),
}

function createApi(baseURL: string) {
  return axios.create({
    baseURL,
    headers: DEFAULT_HEADERS,
    timeout: 10000,
  })
}

export const usuarioApi = createApi(API_URLS.usuario)
export const hogarApi = createApi(API_URLS.hogar)
export const hogarCuentaApi = createApi(API_URLS.hogarCuenta)
export const comprobanteApi = createApi(API_URLS.comprobante)
export const publicacionApi = createApi(API_URLS.publicacion)
export const tareaApi = createApi(API_URLS.tarea)
export const notificacionApi = createApi(API_URLS.notificacion)

export function getApiErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ mensaje?: string; message?: string }>
  const responseData = axiosError.response?.data

  if (typeof responseData === "string") {
    return responseData
  }

  return (
    responseData?.mensaje ||
    responseData?.message ||
    axiosError.message ||
    "Ocurrio un error al conectar con el servicio."
  )
}
