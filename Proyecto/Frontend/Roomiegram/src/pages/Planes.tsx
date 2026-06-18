import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { LogoutButton } from "../components/LogoutButton"
import { useAuth } from "../context/AuthContext"
import {
  membresiaService,
  PLAN_LABELS,
  type PlanId,
  type PlanInfo,
  type Suscripcion,
} from "../services/membresiaService"

const PLAN_COLOR_CLASS: Record<PlanId, string> = {
  GRATIS: "plan-card-gratis",
  PREMIUM_INDIVIDUAL: "plan-card-premium",
  PREMIUM_HOGAR: "plan-card-hogar",
}

export default function Planes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [planes, setPlanes] = useState<PlanInfo[]>([])
  const [suscripcionActiva, setSuscripcionActiva] = useState<Suscripcion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [procesando, setProcesando] = useState<PlanId | null>(null)
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([
      membresiaService.listarPlanes(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
    ]).then(([planesResult, suscripcionResult]) => {
      if (!isMounted) return

      setPlanes(planesResult.status === "fulfilled" ? planesResult.value : [])
      if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
        setSuscripcionActiva(suscripcionResult.value)
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const handleSuscribir = async (planId: PlanId) => {
    if (!user?.id) {
      setMensaje("Debes iniciar sesion para suscribirte.")
      return
    }
    if (suscripcionActiva?.plan === planId) {
      setMensaje("Ya estas suscrito a este plan.")
      return
    }

    setProcesando(planId)
    setMensaje("")

    try {
      const nueva = await membresiaService.suscribir(user.id, planId, planId !== "GRATIS")
      setSuscripcionActiva(nueva)
      setMensaje(
        planId === "GRATIS"
          ? "Has vuelto al plan gratuito."
          : `Suscripcion a ${PLAN_LABELS[planId]} activada correctamente.`,
      )
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo procesar la suscripcion.")
    } finally {
      setProcesando(null)
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
        <p>Desde encontrar roomie hasta convivir mejor, cada plan acompana una etapa distinta.</p>

        {suscripcionActiva && (
          <div className={`plan-activo-badge plan-activo-${planActual.toLowerCase()}`}>
            Plan actual: <strong>{PLAN_LABELS[planActual]}</strong>
            {suscripcionActiva.fechaFin && <span className="plan-activo-fecha"> vence {suscripcionActiva.fechaFin}</span>}
          </div>
        )}
      </section>

      {mensaje && <p className="api-message planes-mensaje">{mensaje}</p>}

      <section className="planes-grid">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando planes...</p></div>
        ) : (
          planes.map((plan) => {
            const esActual = planActual === plan.id
            return (
              <article key={plan.id} className={`plan-card ${PLAN_COLOR_CLASS[plan.id]} ${esActual ? "plan-card-activo" : ""}`}>
                {plan.id === "PREMIUM_INDIVIDUAL" && <span className="plan-popular-badge">Mas popular</span>}
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
                  {procesando === plan.id ? "Procesando..." : esActual ? "Plan actual" : plan.precio === 0 ? "Volver a gratuito" : "Suscribirme"}
                </button>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
