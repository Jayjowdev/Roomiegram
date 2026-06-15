import { getApiErrorMessage, usuarioApi } from "../config/api"

export type PlanId = "GRATIS" | "PREMIUM_INDIVIDUAL" | "PREMIUM_HOGAR"
export type EstadoSuscripcion = "ACTIVA" | "VENCIDA" | "CANCELADA"

export interface PlanInfo {
  id: PlanId
  nombre: string
  precio: number
  descripcion: string
  beneficios: string[]
}

export interface Suscripcion {
  id?: number
  usuarioId: number
  plan: PlanId
  estado: EstadoSuscripcion
  fechaInicio: string
  fechaFin: string | null
  renovacionAutomatica: boolean
}

export const PLAN_LABELS: Record<PlanId, string> = {
  GRATIS: "Gratis",
  PREMIUM_INDIVIDUAL: "Premium Individual",
  PREMIUM_HOGAR: "Premium Hogar",
}

export const PLAN_BADGE_CLASS: Record<PlanId, string> = {
  GRATIS: "plan-badge-gratis",
  PREMIUM_INDIVIDUAL: "plan-badge-premium",
  PREMIUM_HOGAR: "plan-badge-hogar",
}

const FALLBACK_PLANS: PlanInfo[] = [
  {
    id: "GRATIS",
    nombre: "Gratis",
    precio: 0,
    descripcion: "Para empezar a encontrar tu roomie ideal",
    beneficios: ["1 publicacion activa", "Busqueda basica", "1 hogar compartido", "Gestion de tareas y gastos"],
  },
  {
    id: "PREMIUM_INDIVIDUAL",
    nombre: "Premium Individual",
    precio: 4990,
    descripcion: "Para quienes buscan roomie con mas ventajas",
    beneficios: ["Hasta 5 publicaciones activas", "Mayor visibilidad", "Filtros avanzados", "Notificaciones prioritarias"],
  },
  {
    id: "PREMIUM_HOGAR",
    nombre: "Premium Hogar",
    precio: 8990,
    descripcion: "Para grupos que quieren convivir mejor",
    beneficios: ["Hasta 10 integrantes", "Reportes de gastos", "Exportacion de comprobantes", "Recordatorios de pagos"],
  },
]

function freeSubscription(usuarioId: number): Suscripcion {
  return {
    usuarioId,
    plan: "GRATIS",
    estado: "ACTIVA",
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: null,
    renovacionAutomatica: false,
  }
}

export const membresiaService = {
  async listarPlanes(): Promise<PlanInfo[]> {
    try {
      const { data } = await usuarioApi.get<PlanInfo[]>("/auth/membresias/planes")
      return data
    } catch {
      return FALLBACK_PLANS
    }
  },

  async obtenerActiva(usuarioId: number): Promise<Suscripcion> {
    try {
      const { data } = await usuarioApi.get<Suscripcion>(`/auth/membresias/usuario/${usuarioId}`)
      return data
    } catch {
      return freeSubscription(usuarioId)
    }
  },

  async historial(usuarioId: number): Promise<Suscripcion[]> {
    try {
      const { data } = await usuarioApi.get<Suscripcion[]>(`/auth/membresias/usuario/${usuarioId}/historial`)
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },

  async suscribir(usuarioId: number, plan: PlanId, renovacionAutomatica = true): Promise<Suscripcion> {
    try {
      const { data } = await usuarioApi.post<Suscripcion>("/auth/membresias/suscribir", {
        usuarioId,
        plan,
        renovacionAutomatica,
      })
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },

  async cancelar(usuarioId: number): Promise<void> {
    try {
      await usuarioApi.delete(`/auth/membresias/usuario/${usuarioId}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },
}
