import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import {
  membresiaService,
  PLAN_LABELS,
  type PlanId,
  type PlanInfo,
  type Suscripcion,
} from "../services/membresiaService";

const PLAN_ICONS: Record<PlanId, string> = {
  GRATIS: "🏠",
  PREMIUM_INDIVIDUAL: "⭐",
  PREMIUM_HOGAR: "🏆",
};

const PLAN_COLOR_CLASS: Record<PlanId, string> = {
  GRATIS: "plan-card-gratis",
  PREMIUM_INDIVIDUAL: "plan-card-premium",
  PREMIUM_HOGAR: "plan-card-hogar",
};

export default function Planes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planes, setPlanes] = useState<PlanInfo[]>([]);
  const [suscripcionActiva, setSuscripcionActiva] = useState<Suscripcion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [procesando, setProcesando] = useState<PlanId | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      membresiaService.listarPlanes(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
    ]).then(([planesResult, suscripcionResult]) => {
      if (!isMounted) return;

      if (planesResult.status === "fulfilled") {
        setPlanes(planesResult.value);
      } else {
        // Planes por defecto si el backend no responde
        setPlanes([
          {
            id: "GRATIS",
            nombre: "Gratis",
            precio: 0,
            descripcion: "Para empezar a encontrar tu roomie ideal",
            beneficios: [
              "1 publicacion activa",
              "Busqueda basica de roomies",
              "1 hogar compartido",
              "Gestion de tareas y gastos",
              "Notificaciones estandar",
            ],
          },
          {
            id: "PREMIUM_INDIVIDUAL",
            nombre: "Premium Individual",
            precio: 4990,
            descripcion: "Para quienes buscan roomie con mas ventajas",
            beneficios: [
              "Hasta 5 publicaciones activas",
              "Mayor visibilidad en resultados",
              "Filtros avanzados de compatibilidad",
              "Publicaciones destacadas",
              "Historial ampliado de comprobantes",
              "Notificaciones prioritarias",
            ],
          },
          {
            id: "PREMIUM_HOGAR",
            nombre: "Premium Hogar",
            precio: 8990,
            descripcion: "Para grupos que quieren convivir mejor",
            beneficios: [
              "Todo lo de Premium Individual",
              "Hasta 10 integrantes por hogar",
              "Reportes de gastos compartidos",
              "Exportacion de comprobantes",
              "Recordatorios automaticos de pagos",
              "Metricas de convivencia del grupo",
            ],
          },
        ]);
      }

      if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
        setSuscripcionActiva(suscripcionResult.value);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSuscribir = async (planId: PlanId) => {
    if (!user?.id) {
      setMensaje("Debes iniciar sesion para suscribirte.");
      return;
    }
    if (suscripcionActiva?.plan === planId) {
      setMensaje("Ya estas suscrito a este plan.");
      return;
    }

    setProcesando(planId);
    setMensaje("");

    try {
      const nueva = await membresiaService.suscribir(user.id, planId, planId !== "GRATIS");
      setSuscripcionActiva(nueva);
      setMensaje(
        planId === "GRATIS"
          ? "Has vuelto al plan gratuito."
          : `Suscripcion a ${PLAN_LABELS[planId]} activada correctamente.`
      );
    } catch {
      setMensaje("No se pudo procesar la suscripcion. Intenta nuevamente.");
    } finally {
      setProcesando(null);
    }
  };

  const planActual = suscripcionActiva?.plan ?? "GRATIS";

  return (
    <div className="planes-page">
      <header className="home-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/")} />
        <div className="home-header-actions">
          {user && (
            <button className="btn btn-outline-success me-2" onClick={() => navigate("/mi-perfil")}>
              Mi perfil
            </button>
          )}
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/home")}>
            Inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="planes-hero">
        <span className="planes-kicker">Modelo de negocio</span>
        <h1>Elige el plan ideal para ti</h1>
        <p>Desde encontrar roomie hasta convivir mejor — tenemos un plan para cada etapa.</p>

        {suscripcionActiva && (
          <div className={`plan-activo-badge plan-activo-${planActual.toLowerCase()}`}>
            {PLAN_ICONS[planActual]} Plan actual:{" "}
            <strong>{PLAN_LABELS[planActual]}</strong>
            {suscripcionActiva.fechaFin && (
              <span className="plan-activo-fecha">
                {" "}· Vence: {suscripcionActiva.fechaFin}
              </span>
            )}
          </div>
        )}
      </section>

      {mensaje && (
        <p className={`api-message planes-mensaje ${mensaje.includes("correctamente") || mensaje.includes("gratuito") ? "planes-mensaje-ok" : ""}`}>
          {mensaje}
        </p>
      )}

      <section className="planes-grid">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando planes...</p></div>
        ) : (
          planes.map((plan) => {
            const esActual = planActual === plan.id;
            return (
              <article
                key={plan.id}
                className={`plan-card ${PLAN_COLOR_CLASS[plan.id]} ${esActual ? "plan-card-activo" : ""}`}
              >
                {plan.id === "PREMIUM_INDIVIDUAL" && (
                  <span className="plan-popular-badge">Mas popular</span>
                )}
                <div className="plan-card-icon">{PLAN_ICONS[plan.id]}</div>
                <h2 className="plan-card-nombre">{plan.nombre}</h2>
                <p className="plan-card-desc">{plan.descripcion}</p>
                <div className="plan-card-precio">
                  {plan.precio === 0 ? (
                    <span className="plan-precio-gratis">Gratis</span>
                  ) : (
                    <>
                      <span className="plan-precio-valor">
                        ${plan.precio.toLocaleString("es-CL")}
                      </span>
                      <span className="plan-precio-periodo">/mes</span>
                    </>
                  )}
                </div>
                <ul className="plan-beneficios">
                  {plan.beneficios.map((b) => (
                    <li key={b} className="plan-beneficio-item">
                      <span className="plan-check">✓</span> {b}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn w-100 mt-auto ${esActual ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => handleSuscribir(plan.id)}
                  disabled={procesando !== null || esActual}
                >
                  {procesando === plan.id
                    ? "Procesando..."
                    : esActual
                    ? "Plan actual"
                    : plan.precio === 0
                    ? "Volver a gratuito"
                    : "Suscribirme"}
                </button>
              </article>
            );
          })
        )}
      </section>

      <section className="planes-faq">
        <h2>Preguntas frecuentes</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <strong>¿Puedo cambiar de plan cuando quiera?</strong>
            <p>Si, puedes subir o bajar de plan en cualquier momento desde esta pantalla.</p>
          </div>
          <div className="faq-item">
            <strong>¿Que pasa al vencer el plan?</strong>
            <p>Vuelves automaticamente al plan gratuito. Tus datos se conservan.</p>
          </div>
          <div className="faq-item">
            <strong>¿Los pagos son seguros?</strong>
            <p>Integramos pasarelas de pago certificadas. Tus datos financieros nunca se almacenan en nuestros servidores.</p>
          </div>
          <div className="faq-item">
            <strong>¿Hay descuento anual?</strong>
            <p>Si pagas anualmente obtienes 2 meses gratis en los planes Premium.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>(c) 2026 Roomiegram</p>
      </footer>
    </div>
  );
}
