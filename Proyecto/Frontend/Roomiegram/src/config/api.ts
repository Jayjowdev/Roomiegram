import axios from "axios"
import type { AxiosError } from "axios"

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

function createApi(baseURL: string) {
  return axios.create({
    baseURL,
    headers: DEFAULT_HEADERS,
    timeout: 10000,
  })
}

export const usuarioApi = createApi("http://localhost:8088")
export const hogarApi = createApi("http://localhost:8083")
export const hogarCuentaApi = createApi("http://localhost:8084")
export const comprobanteApi = createApi("http://localhost:8082")
export const publicacionApi = createApi("http://localhost:8086")
export const tareaApi = createApi("http://localhost:8087")
export const notificacionApi = createApi("http://localhost:8085")

export function getApiErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ mensaje?: string; message?: string }>

  return (
    axiosError.response?.data?.mensaje ||
    axiosError.response?.data?.message ||
    axiosError.message ||
    "Ocurrio un error al conectar con el servicio."
  )
}
