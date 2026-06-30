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

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}

function readBooleanEnv(value?: string) {
  return value?.trim().toLowerCase() === "true"
}

const gatewayUrl = readEnv(import.meta.env.VITE_API_GATEWAY_URL)?.replace(/\/+$/, "")
const useDirectServiceUrls = readBooleanEnv(import.meta.env.VITE_USE_DIRECT_SERVICE_URLS)

function buildServiceUrl(port: number) {
  const apiBaseUrl = readEnv(import.meta.env.VITE_API_BASE_URL) ?? "http://localhost"
  return `${cleanBaseUrl(apiBaseUrl)}:${port}`
}

function resolveServiceUrl(overrideUrl: string | undefined, port: number) {
  if (!useDirectServiceUrls && gatewayUrl) {
    return gatewayUrl
  }

  return (
    readEnv(overrideUrl) ??
    gatewayUrl ??
    buildServiceUrl(port)
  )
}

const API_URLS = {
  usuario: resolveServiceUrl(import.meta.env.VITE_USUARIO_API_URL, SERVICE_PORTS.usuario),
  hogar: resolveServiceUrl(import.meta.env.VITE_HOGAR_API_URL, SERVICE_PORTS.hogar),
  hogarCuenta: resolveServiceUrl(import.meta.env.VITE_HOGAR_CUENTA_API_URL, SERVICE_PORTS.hogarCuenta),
  comprobante: resolveServiceUrl(import.meta.env.VITE_COMPROBANTE_API_URL, SERVICE_PORTS.comprobante),
  publicacion: resolveServiceUrl(import.meta.env.VITE_PUBLICACION_API_URL, SERVICE_PORTS.publicacion),
  tarea: resolveServiceUrl(import.meta.env.VITE_TAREA_API_URL, SERVICE_PORTS.tarea),
  notificacion: resolveServiceUrl(import.meta.env.VITE_NOTIFICACION_API_URL, SERVICE_PORTS.notificacion),
}

function getBasicAuthHeader(): string | undefined {
  try {
    const session = localStorage.getItem("roomiegram.session")
    if (!session) return undefined
    const parsed = JSON.parse(session) as { credentials?: { usuario: string; contrasena: string } }
    if (!parsed.credentials) return undefined
    const { usuario, contrasena } = parsed.credentials
    return `Basic ${btoa(`${usuario}:${contrasena}`)}`
  } catch {
    return undefined
  }
}

function createApi(baseURL: string) {
  const api = axios.create({
    baseURL,
    headers: DEFAULT_HEADERS,
    timeout: 10000,
  })

  api.interceptors.request.use((config) => {
    const url = config.url || ""
    const isProtectedAuthEndpoint =
      url.startsWith("/auth/colaboradores") || url.startsWith("/auth/admin/")

    if (isProtectedAuthEndpoint) {
      const authHeader = getBasicAuthHeader()
      if (authHeader) {
        config.headers.Authorization = authHeader
      }
    }
    return config
  })

  return api
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
