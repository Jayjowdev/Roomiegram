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

export interface PreferenciaPago {
  initPoint: string
  externalReference: string
  publicKey: string
}

export interface ResultadoPago {
  aprobado: boolean
  estado: "aprobado" | "pendiente" | "rechazado"
  mensaje: string
}

export interface EstadoDemoPagos {
  habilitado: boolean
  demoEnabled: boolean
  entornoLocal: boolean
  mensaje: string
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

export const PLAN_STATUS_TEXT: Record<PlanId, string> = {
  GRATIS: "Acceso básico activo",
  PREMIUM_INDIVIDUAL: "Premium Individual activo",
  PREMIUM_HOGAR: "Premium Hogar activo",
}

export const PLAN_ACTIVE_BENEFIT: Record<PlanId, string> = {
  GRATIS: "Puedes usar funciones básicas; los reportes del hogar y beneficios destacados quedan reservados para Premium.",
  PREMIUM_INDIVIDUAL: "Beneficio activo: perfil, publicaciones y compatibilidad destacados para encontrar mejores matches.",
  PREMIUM_HOGAR: "Beneficio activo: reportes del hogar, convivencia, gastos y comprobantes para organizar el grupo.",
}

export function isPremiumPlan(plan?: PlanId | null) {
  return plan === "PREMIUM_INDIVIDUAL" || plan === "PREMIUM_HOGAR"
}

export function isPremiumHogar(plan?: PlanId | null) {
  return plan === "PREMIUM_HOGAR"
}

const FALLBACK_PLANS: PlanInfo[] = [
  {
    id: "GRATIS",
    nombre: "Gratis",
    precio: 0,
    descripcion: "Para empezar a encontrar tu roomie ideal",
    beneficios: ["Crear publicaciones y perfiles roomie", "Búsqueda por tipo y ubicación", "Unirse o crear un hogar", "Gestión básica de tareas y gastos"],
  },
  {
    id: "PREMIUM_INDIVIDUAL",
    nombre: "Premium Individual",
    precio: 4990,
    descripcion: "Para destacar tu perfil, publicaciones y compatibilidad al buscar roomie",
    beneficios: ["Perfil y publicaciones con estado Premium", "Compatibilidad y preferencias destacadas", "Gestión de solicitudes e invitaciones", "Avisos por correo"],
  },
  {
    id: "PREMIUM_HOGAR",
    nombre: "Premium Hogar",
    precio: 8990,
    descripcion: "Para hogares que necesitan reportes, gastos y comprobantes mejor organizados",
    beneficios: ["Reportes avanzados del hogar", "Resumen de tareas, gastos y deuda", "Seguimiento de comprobantes", "Recomendaciones de convivencia"],
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

  async crearPreferenciaPago(usuarioId: number, plan: PlanId): Promise<PreferenciaPago> {
    try {
      const { data } = await usuarioApi.post<PreferenciaPago>("/auth/membresias/crear-preferencia", {
        usuarioId,
        plan,
      })
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },

  async verificarPago(externalReference: string, paymentId?: string | null): Promise<ResultadoPago> {
    try {
      const { data } = await usuarioApi.get<ResultadoPago>("/auth/membresias/verificar-pago", {
        params: {
          externalReference,
          paymentId: paymentId || undefined,
        },
      })
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  },

  async obtenerEstadoDemo(): Promise<EstadoDemoPagos> {
    try {
      const { data } = await usuarioApi.get<EstadoDemoPagos>("/auth/membresias/demo/estado")
      return data
    } catch {
      return {
        habilitado: false,
        demoEnabled: false,
        entornoLocal: false,
        mensaje: "Modo demo no disponible. Revisa que el backend de usuario esté activo.",
      }
    }
  },

  async suscribirDemo(usuarioId: number, plan: PlanId): Promise<Suscripcion> {
    try {
      const { data } = await usuarioApi.post<Suscripcion>("/auth/membresias/demo/suscribir", {
        usuarioId,
        plan,
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
