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

const MATRIZ_PLANES_REALES = [
  {
    beneficio: "Busqueda y publicaciones basicas",
    GRATIS: "Incluido",
    PREMIUM_INDIVIDUAL: "Incluido + visibilidad destacada",
    PREMIUM_HOGAR: "Incluido",
  },
  {
    beneficio: "Compatibilidad, reputacion y resenas",
    GRATIS: "Basico",
    PREMIUM_INDIVIDUAL: "Detallado y destacado",
    PREMIUM_HOGAR: "Basico",
  },
  {
    beneficio: "Tareas, gastos y comprobantes del hogar",
    GRATIS: "No incluido",
    PREMIUM_INDIVIDUAL: "No incluido",
    PREMIUM_HOGAR: "Incluido para integrantes actuales",
  },
  {
    beneficio: "Actividad y acciones de convivencia",
    GRATIS: "No incluido",
    PREMIUM_INDIVIDUAL: "No incluido",
    PREMIUM_HOGAR: "Incluido para integrantes actuales",
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
  const [planDetalle, setPlanDetalle] = useState<PlanId | null>(null)

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
      } else if (user?.id && suscripcionResult.status === "rejected") {
        setMensaje("No se pudo cargar tu plan actual. Revisa que el backend de usuario y la URL del API esten activos.")
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
      if (!preferencia.initPoint) {
        throw new Error("Mercado Pago no devolvio un enlace de pago. Revisa la configuracion del access token.")
      }
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
      const confirmada = await membresiaService.obtenerActiva(user.id)
      setSuscripcionActiva(confirmada)
      setMensaje(`Plan demo activado: ${PLAN_LABELS[nueva.plan]}.`)
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo activar el plan demo.")
    } finally {
      setProcesandoDemo(null)
    }
  }

  const planActual = suscripcionActiva?.plan ?? null
  const puedeVerDemoAdmin = demoEstado?.habilitado && user?.role === "ADMIN"

  return (
    <div className="planes-page">
      <header className="home-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/home")} />
        <div className="home-header-actions">
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/home")}>
            Inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="planes-hero">
        <span className="planes-kicker">Planes Roomiegram</span>
        <h1>Elige el plan ideal para ti</h1>
        <p>Gratis te ayuda a empezar, Premium Individual mejora tu busqueda y Premium Hogar desbloquea la gestion operativa del hogar.</p>

        {suscripcionActiva && (
          <div className={`plan-activo-badge plan-activo-${suscripcionActiva.plan.toLowerCase()}`}>
            {PLAN_STATUS_TEXT[suscripcionActiva.plan]}: <strong>{PLAN_LABELS[suscripcionActiva.plan]}</strong>
            {suscripcionActiva.fechaFin && <span className="plan-activo-fecha"> vence {suscripcionActiva.fechaFin}</span>}
          </div>
        )}
        <p>
          {planActual
            ? PLAN_ACTIVE_BENEFIT[planActual]
            : "Cuando cargue tu membresia, aqui veras exactamente que beneficios tienes activos."}
        </p>
      </section>

      {mensaje && <p className="api-message planes-mensaje">{mensaje}</p>}

      {puedeVerDemoAdmin && (
        <section className="dashboard-content">
          <div className="dashboard-activity">
            <div className="section-heading-row">
              <div>
                <span className="demo-kicker">Herramienta ADMIN</span>
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
                      <span className="plan-check">Incluye</span> {beneficio}
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
                <button
                  className="btn btn-outline-success w-100 mt-2"
                  type="button"
                  onClick={() => setPlanDetalle(planDetalle === plan.id ? null : plan.id)}
                >
                  {planDetalle === plan.id ? "Ocultar beneficios" : "Ver qué desbloquea"}
                </button>
                {planDetalle === plan.id && (
                  <p className="form-helper">
                    {plan.id === "GRATIS"
                      ? "Ideal para explorar Roomiegram, crear publicaciones, buscar roomies y ver datos basicos del hogar."
                      : plan.id === "PREMIUM_INDIVIDUAL"
                        ? "Pensado para destacar tu perfil, mostrar reputacion y usar compatibilidad con mas claridad. Es un beneficio personal, no se comparte con el hogar."
                        : "Pensado para hogares que quieren tareas, gastos, comprobantes y actividad operativa. El titular habilita el beneficio al grupo mientras siga dentro del hogar."}
                  </p>
                )}
              </article>
            )
          })
        )}
      </section>

      <section className="module-list planes-benefits-matrix">
        <h3>Qué desbloquea cada plan</h3>
        {MATRIZ_PLANES_REALES.map((item) => (
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
