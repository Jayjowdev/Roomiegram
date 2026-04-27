import axios from 'axios'
import { microserviceBaseUrls } from '../config/microservices'

export const apiClients = {
  auth: axios.create({
    baseURL: microserviceBaseUrls.auth,
    headers: { 'Content-Type': 'application/json' },
  }),
  hogar: axios.create({
    baseURL: microserviceBaseUrls.hogar,
    headers: { 'Content-Type': 'application/json' },
  }),
  hogarCuenta: axios.create({
    baseURL: microserviceBaseUrls.hogarCuenta,
    headers: { 'Content-Type': 'application/json' },
  }),
  comprobante: axios.create({
    baseURL: microserviceBaseUrls.comprobante,
    headers: { 'Content-Type': 'application/json' },
  }),
  notificacion: axios.create({
    baseURL: microserviceBaseUrls.notificacion,
    headers: { 'Content-Type': 'application/json' },
  }),
  publicacion: axios.create({
    baseURL: microserviceBaseUrls.publicacion,
    headers: { 'Content-Type': 'application/json' },
  }),
  tarea: axios.create({
    baseURL: microserviceBaseUrls.tarea,
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