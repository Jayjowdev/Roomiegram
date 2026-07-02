import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { LogoutButton } from "../components/LogoutButton"
import { useAuth } from "../context/AuthContext"
import {
  membresiaService,
  PLAN_ACTIVE_BENEFIT,
  PLAN_LABELS,
  PLAN_STATUS_TEXT,
  type EstadoDemoPagos,
  type PlanId,
  type PlanInfo,
  type Suscripcion,
} from "../services/membresiaService"

const PLAN_COLOR_CLASS: Record<PlanId, string> = {
  GRATIS: "plan-card-gratis",
  PREMIUM_INDIVIDUAL: "plan-card-premium",
  PREMIUM_HOGAR: "plan-card-hogar",
}

const BENEFICIOS_PLANES = [
  {
    beneficio: "Búsqueda y publicaciones básicas",
    GRATIS: "Incluido",
    PREMIUM_INDIVIDUAL: "Incluido + perfil destacado",
    PREMIUM_HOGAR: "Incluido",
  },
  {
    beneficio: "Compatibilidad, reputación y reseñas",
    GRATIS: "Vista básica",
    PREMIUM_INDIVIDUAL: "Destacado",
    PREMIUM_HOGAR: "Incluido para integrantes",
  },
  {
    beneficio: "Gastos, comprobantes y actividad del hogar",
    GRATIS: "Gestión básica",
    PREMIUM_INDIVIDUAL: "Gestión básica",
    PREMIUM_HOGAR: "Reportes avanzados",
  },
  {
    beneficio: "Reportes de convivencia",
    GRATIS: "Bloqueado",
    PREMIUM_INDIVIDUAL: "Bloqueado",
    PREMIUM_HOGAR: "Completo",
  },
] satisfies Array<{ beneficio: string } & Record<PlanId, string>>

function getPagoErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo iniciar el pago."

  if (message.includes("MERCADOPAGO_ACCESS_TOKEN")) {
    return "Mercado Pago no está listo: falta MERCADOPAGO_ACCESS_TOKEN en .env. Agrega tu access token sandbox o real y reinicia el backend."
  }

  return message
}

export default function Planes() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [planes, setPlanes] = useState<PlanInfo[]>([])
  const [suscripcionActiva, setSuscripcionActiva] = useState<Suscripcion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [procesando, setProcesando] = useState<PlanId | null>(null)
  const [procesandoDemo, setProcesandoDemo] = useState<PlanId | null>(null)
  const [demoEstado, setDemoEstado] = useState<EstadoDemoPagos | null>(null)
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([
      membresiaService.listarPlanes(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
      membresiaService.obtenerEstadoDemo(),
    ]).then(([planesResult, suscripcionResult, demoResult]) => {
      if (!isMounted) return

      setPlanes(planesResult.status === "fulfilled" ? planesResult.value : [])
      if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
        setSuscripcionActiva(suscripcionResult.value)
      }
      if (demoResult.status === "fulfilled") {
        setDemoEstado(demoResult.value)
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  useEffect(() => {
    const estadoPago = searchParams.get("pago")
    const externalReference = searchParams.get("external_reference")
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id")

    if (!estadoPago) return

    if (estadoPago === "exitoso" && externalReference && user?.id) {
      setMensaje("Verificando tu pago...")
      membresiaService
        .verificarPago(externalReference, paymentId)
        .then((resultado) => {
          if (resultado.aprobado) {
            setMensaje("Pago confirmado. Tu suscripción premium está activa.")
            return membresiaService.obtenerActiva(user.id)
          }

          setMensaje(
            resultado.estado === "rechazado"
              ? "El pago no pudo confirmarse. Puedes intentarlo nuevamente."
              : "Tu pago aún no aparece como aprobado. En unos minutos se actualizará automáticamente.",
          )
          return null
        })
        .then((nuevaSuscripcion) => {
          if (nuevaSuscripcion) setSuscripcionActiva(nuevaSuscripcion)
        })
        .catch(() => {
          setMensaje("No se pudo verificar el pago. Si ya pagaste, tu suscripción se activará en breve.")
        })
        .finally(() => {
          setSearchParams({}, { replace: true })
        })
    } else if (estadoPago === "pendiente") {
      setMensaje("Tu pago está pendiente. En cuanto se acredite, tu suscripción se activará automáticamente.")
      setSearchParams({}, { replace: true })
    } else if (estadoPago === "error") {
      setMensaje("El pago no se pudo completar. Puedes intentarlo nuevamente.")
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, user?.id])

  const handleSuscribir = async (planId: PlanId) => {
    if (!user?.id) {
      setMensaje("Debes iniciar sesión para suscribirte.")
      return
    }
    if (suscripcionActiva?.plan === planId) {
      setMensaje("Ya estás suscrito a este plan.")
      return
    }

    setProcesando(planId)
    setMensaje("")

    try {
      if (planId === "GRATIS") {
        const nueva = await membresiaService.suscribir(user.id, planId, false)
        setSuscripcionActiva(nueva)
        setMensaje("Has vuelto al plan gratuito.")
        return
      }

      const preferencia = await membresiaService.crearPreferenciaPago(user.id, planId)
      window.location.href = preferencia.initPoint
    } catch (error) {
      setMensaje(getPagoErrorMessage(error))
    } finally {
      setProcesando(null)
    }
  }

  const handleSuscribirDemo = async (planId: PlanId) => {
    if (!user?.id) {
      setMensaje("Debes iniciar sesión para probar un plan demo.")
      return
    }

    setProcesandoDemo(planId)
    setMensaje("")

    try {
      const nueva = await membresiaService.suscribirDemo(user.id, planId)
      setSuscripcionActiva(nueva)
      setMensaje(`Plan demo activado: ${PLAN_LABELS[planId]}.`)
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo activar el plan demo.")
    } finally {
      setProcesandoDemo(null)
    }
  }

  const planActual = suscripcionActiva?.plan ?? "GRATIS"

  return (
    <div className="planes-page">
      <header className="home-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/home")} />
        <div className="home-header-actions">
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/mi-perfil")}>
            Mi perfil
          </button>
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/home")}>
            Inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="planes-hero">
        <span className="planes-kicker">Planes Roomiegram</span>
        <h1>Elige el plan ideal para ti</h1>
        <p>Gratis te ayuda a empezar, Premium Individual mejora tu búsqueda y Premium Hogar ordena la convivencia real con gastos, comprobantes y reportes.</p>

        {suscripcionActiva && (
          <div className={`plan-activo-badge plan-activo-${planActual.toLowerCase()}`}>
            {PLAN_STATUS_TEXT[planActual]}: <strong>{PLAN_LABELS[planActual]}</strong>
            {suscripcionActiva.fechaFin && <span className="plan-activo-fecha"> vence {suscripcionActiva.fechaFin}</span>}
          </div>
        )}
        <p>{PLAN_ACTIVE_BENEFIT[planActual]}</p>
      </section>

      {mensaje && <p className="api-message planes-mensaje">{mensaje}</p>}

      {demoEstado?.habilitado && (
        <section className="dashboard-content">
          <div className="dashboard-activity">
            <div className="section-heading-row">
              <div>
                <span className="demo-kicker">Modo demo local</span>
                <h3>Probar membresías sin pago real</h3>
                <p>Disponible solo en localhost con PAGOS_DEMO_ENABLED=true. Mercado Pago real sigue intacto para sandbox o producción.</p>
              </div>
            </div>
            <div className="module-grid">
              {(["GRATIS", "PREMIUM_INDIVIDUAL", "PREMIUM_HOGAR"] as PlanId[]).map((planId) => (
                <button
                  key={planId}
                  className="module-link"
                  onClick={() => handleSuscribirDemo(planId)}
                  disabled={procesando !== null || procesandoDemo !== null}
                >
                  <strong>{procesandoDemo === planId ? "Activando..." : `Activar ${PLAN_LABELS[planId]}`}</strong>
                  <span>{PLAN_ACTIVE_BENEFIT[planId]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="planes-grid">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando planes...</p></div>
        ) : (
          planes.map((plan) => {
            const esActual = planActual === plan.id
            return (
              <article key={plan.id} className={`plan-card ${PLAN_COLOR_CLASS[plan.id]} ${esActual ? "plan-card-activo" : ""}`}>
                {plan.id === "PREMIUM_INDIVIDUAL" && <span className="plan-popular-badge">Más popular</span>}
                <h2 className="plan-card-nombre">{plan.nombre}</h2>
                <p className="plan-card-desc">{plan.descripcion}</p>
                <div className="plan-card-precio">
                  {plan.precio === 0 ? (
                    <span className="plan-precio-gratis">Gratis</span>
                  ) : (
                    <>
                      <span className="plan-precio-valor">${plan.precio.toLocaleString("es-CL")}</span>
                      <span className="plan-precio-periodo">/mes</span>
                    </>
                  )}
                </div>
                <ul className="plan-beneficios">
                  {plan.beneficios.map((beneficio) => (
                    <li key={beneficio} className="plan-beneficio-item">
                      <span className="plan-check">OK</span> {beneficio}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn w-100 mt-auto ${esActual ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => handleSuscribir(plan.id)}
                  disabled={procesando !== null || esActual}
                >
                  {procesando === plan.id ? "Procesando..." : esActual ? "Plan actual" : plan.precio === 0 ? "Volver a gratuito" : "Pagar con Mercado Pago"}
                </button>
              </article>
            )
          })
        )}
      </section>

      <section className="module-list planes-benefits-matrix">
        <h3>Qué desbloquea cada plan</h3>
        {BENEFICIOS_PLANES.map((item) => (
          <article className="module-item" key={item.beneficio}>
            <h4>{item.beneficio}</h4>
            <div className="notification-context-grid">
              <span><strong>Gratis:</strong> {item.GRATIS}</span>
              <span><strong>Premium Individual:</strong> {item.PREMIUM_INDIVIDUAL}</span>
              <span><strong>Premium Hogar:</strong> {item.PREMIUM_HOGAR}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
