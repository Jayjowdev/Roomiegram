import axios from "axios"
import type { AxiosError } from "axios"

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

function apiUrl(port: number) {
  return `http://${window.location.hostname}:${port}`
}

const API_URLS = {
  usuario: apiUrl(8088),
  hogar: apiUrl(8083),
  hogarCuenta: apiUrl(8084),
  comprobante: apiUrl(8082),
  publicacion: apiUrl(8086),
  tarea: apiUrl(8087),
  notificacion: apiUrl(8085),
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
