import axios from "axios"
import type { AxiosError } from "axios"

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

const API_URLS = {
  usuario: import.meta.env.VITE_USUARIO_API_URL ?? "http://localhost:8088",
  hogar: import.meta.env.VITE_HOGAR_API_URL ?? "http://localhost:8083",
  hogarCuenta: import.meta.env.VITE_HOGAR_CUENTA_API_URL ?? "http://localhost:8084",
  comprobante: import.meta.env.VITE_COMPROBANTE_API_URL ?? "http://localhost:8082",
  publicacion: import.meta.env.VITE_PUBLICACION_API_URL ?? "http://localhost:8086",
  tarea: import.meta.env.VITE_TAREA_API_URL ?? "http://localhost:8087",
  notificacion: import.meta.env.VITE_NOTIFICACION_API_URL ?? "http://localhost:8085",
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
