import { usuarioApi, getApiErrorMessage } from "../config/api"

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

export const membresiaService = {
  async listarPlanes(): Promise<PlanInfo[]> {
    try {
      const { data } = await usuarioApi.get<PlanInfo[]>("/membresias/planes")
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },

  async obtenerActiva(usuarioId: number): Promise<Suscripcion> {
    try {
      const { data } = await usuarioApi.get<Suscripcion>(`/membresias/usuario/${usuarioId}`)
      return data
    } catch (error) {
      // Fallback: si el servicio no responde, devolver plan gratis virtual
      return {
        usuarioId,
        plan: "GRATIS",
        estado: "ACTIVA",
        fechaInicio: new Date().toISOString().slice(0, 10),
        fechaFin: null,
        renovacionAutomatica: false,
      }
    }
  },

  async historial(usuarioId: number): Promise<Suscripcion[]> {
    try {
      const { data } = await usuarioApi.get<Suscripcion[]>(`/membresias/usuario/${usuarioId}/historial`)
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },

  async suscribir(usuarioId: number, plan: PlanId, renovacionAutomatica = true): Promise<Suscripcion> {
    try {
      const { data } = await usuarioApi.post<Suscripcion>("/membresias/suscribir", {
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
      await usuarioApi.delete(`/membresias/usuario/${usuarioId}`)
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },
}
