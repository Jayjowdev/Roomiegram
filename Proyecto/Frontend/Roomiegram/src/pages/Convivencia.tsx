import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { comprobanteService } from "../services/comprobanteService";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import { isPremiumHogar, membresiaService, PLAN_BADGE_CLASS, PLAN_LABELS, type PlanId, type Suscripcion } from "../services/membresiaService";
import { notificacionService } from "../services/notificacionService";
import { tareaService } from "../services/tareaService";
import { usuarioService } from "../services/usuarioService";
import type { CategoriaGasto, Comprobante, EstadoGasto, HogarCuenta, Notificacion } from "../types/Backend";
import type { Hogar } from "../types/Hogar";
import type { Tarea } from "../types/Tarea";
import type { UsuarioResumen } from "../types/Usuario";

type LoadState = {
  hogares: Hogar[];
  tareas: Tarea[];
  gastos: HogarCuenta[];
  comprobantes: Comprobante[];
  notificaciones: Notificacion[];
  usuarios: UsuarioResumen[];
};

type RecomendacionHogar = {
  titulo: string;
  detalle: string;
  ruta?: string;
};

type ActividadHogar = {
  titulo: string;
  detalle: string;
  ruta: string;
  fecha?: string;
  fechaOrden?: number;
  prioridad?: number;
};

const emptyState: LoadState = {
  hogares: [],
  tareas: [],
  gastos: [],
  comprobantes: [],
  notificaciones: [],
  usuarios: [],
};

const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  ARRIENDO: "Arriendo",
  LUZ: "Luz",
  AGUA: "Agua",
  GAS: "Gas",
  INTERNET: "Internet",
  GASTO_COMUN: "Gasto común",
  COMIDA: "Comida",
  OTRO: "Otro",
};

const ESTADO_LABELS: Record<EstadoGasto, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  RESPALDADO: "Respaldado",
};

function formatCurrency(value?: number) {
  return `$${Math.round(Number(value || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function uniqueIds(ids: Array<number | undefined>) {
  return [...new Set(ids.filter((id): id is number => typeof id === "number" && id > 0))];
}

function getCategoriaLabel(categoria?: CategoriaGasto) {
  return CATEGORIA_LABELS[categoria || "OTRO"];
}

function getEstadoRespaldo(monto: number, respaldado: number): EstadoGasto {
  if (respaldado <= 0) return "PENDIENTE";
  if (respaldado < monto) return "PARCIAL";
  return "RESPALDADO";
}

function getDateOrder(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getActivityOrder(fecha?: string, prioridad = 0) {
  return getDateOrder(fecha) || Date.now() - prioridad;
}

function getMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string }
) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tu";

  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || "Integrante del hogar";
}

export default function Convivencia() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<LoadState>(emptyState);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [planesIntegrantes, setPlanesIntegrantes] = useState<Record<number, PlanId>>({});

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      hogarService.listar(),
      tareaService.listar(),
      gastoService.listar(),
      comprobanteService.listar(),
      notificacionService.listar(),
      usuarioService.listar(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
    ]).then(([hogaresResult, tareasResult, gastosResult, comprobantesResult, notificacionesResult, usuariosResult, suscripcionResult]) => {
      if (!isMounted) return;

      const partialData: LoadState = {
        hogares: hogaresResult.status === "fulfilled" ? hogaresResult.value : [],
        tareas: tareasResult.status === "fulfilled" ? tareasResult.value : [],
        gastos: gastosResult.status === "fulfilled" ? gastosResult.value : [],
        comprobantes: comprobantesResult.status === "fulfilled" ? comprobantesResult.value : [],
        notificaciones:
          notificacionesResult.status === "fulfilled" ? notificacionesResult.value : [],
        usuarios: usuariosResult.status === "fulfilled" ? usuariosResult.value : [],
      };

      setData(partialData);
      if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
        setSuscripcion(suscripcionResult.value as Suscripcion);
      } else if (user?.id && suscripcionResult.status === "rejected") {
        setMessage("No se pudo cargar tu plan actual. Revisa que el backend de usuario este activo.");
      }
      setIsLoading(false);

      if ([hogaresResult, tareasResult, gastosResult, comprobantesResult, notificacionesResult, usuariosResult].some((result) => result.status === "rejected")) {
        setMessage("Algunos datos del hogar no se pudieron cargar. Revisa que los microservicios estén activos.");
      } else if (!(user?.id && suscripcionResult.status === "rejected")) {
        setMessage("");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const hogarActual = useMemo(() => {
    if (!user?.id) return undefined;

    return data.hogares.find((hogar) => {
      const integrantes = hogar.integrantesIds || [];
      return integrantes.includes(user.id) || hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id;
    });
  }, [data.hogares, user?.id]);

  const integrantes = useMemo(() => {
    if (!hogarActual) return [];

    return uniqueIds([
      hogarActual.usuarioAdministradorId,
      hogarActual.usuarioCreadorId,
      ...(hogarActual.integrantesIds || []),
    ]);
  }, [hogarActual]);

  useEffect(() => {
    const ids = uniqueIds([user?.id, ...integrantes]);
    if (!ids.length) {
      setPlanesIntegrantes({});
      return;
    }

    let isMounted = true;

    Promise.allSettled(ids.map((usuarioId) => membresiaService.obtenerActiva(usuarioId)))
      .then((results) => {
        if (!isMounted) return;

        const planes = results.reduce<Record<number, PlanId>>((acc, result, index) => {
          const usuarioId = ids[index];
          if (!usuarioId) return acc;
          if (result.status === "fulfilled") acc[usuarioId] = result.value.plan;
          return acc;
        }, {});

        if (user?.id && suscripcion?.plan) {
          planes[user.id] = suscripcion.plan;
        }

        setPlanesIntegrantes(planes);

        if (results.some((result) => result.status === "rejected")) {
          setMessage("No se pudieron confirmar todos los planes del hogar. Premium Hogar por grupo se activara cuando el backend confirme un titular premium.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [integrantes, suscripcion?.plan, user?.id]);

  const tareasDelHogar = useMemo(() => {
    if (!hogarActual) return [];
    const ids = hogarActual.tareasIds || [];
    return ids.length ? data.tareas.filter((tarea) => ids.includes(tarea.id)) : [];
  }, [data.tareas, hogarActual]);

  const gastosDelHogar = useMemo(() => {
    if (!hogarActual) return [];
    const ids = hogarActual.hogarCuentaIds || [];
    return ids.length ? data.gastos.filter((gasto) => gasto.id && ids.includes(gasto.id)) : [];
  }, [data.gastos, hogarActual]);

  const gastoIds = useMemo(() => gastosDelHogar.map((gasto) => gasto.id).filter((id): id is number => !!id), [gastosDelHogar]);

  const comprobantesDelHogar = useMemo(() => {
    const comprobanteIds = hogarActual?.comprobanteIds || [];
    return data.comprobantes.filter((comprobante) =>
      gastoIds.includes(comprobante.hogarCuentaId) || (comprobante.id ? comprobanteIds.includes(comprobante.id) : false)
    );
  }, [data.comprobantes, gastoIds, hogarActual?.comprobanteIds]);

  const notificacionesDelHogar = useMemo(() => {
    if (!hogarActual) return [];

    return data.notificaciones.filter((notificacion) => {
      return (
        notificacion.hogarId === hogarActual.id ||
        notificacion.usuarioReceptorId === user?.id ||
        notificacion.usuarioEmisorId === user?.id
      );
    });
  }, [data.notificaciones, hogarActual, user?.id]);

  const tareasActivas = tareasDelHogar.filter((tarea) => tarea.completada !== true).length;
  const totalGastos = gastosDelHogar.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);
  const totalRespaldado = comprobantesDelHogar.reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const totalPendienteGastos = Math.max(0, totalGastos - totalRespaldado);
  const gastosPendientes = gastosDelHogar.filter((gasto) => {
    const respaldado = comprobantesDelHogar
      .filter((comprobante) => comprobante.hogarCuentaId === gasto.id)
      .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
    return getEstadoRespaldo(Number(gasto.monto || 0), respaldado) !== "RESPALDADO";
  });
  const serviciosBasicosPendientes = gastosPendientes.filter((gasto) =>
    ["LUZ", "AGUA", "GAS", "INTERNET", "GASTO_COMUN"].includes(gasto.categoria || "OTRO")
  ).length;
  const deudaUsuario = gastosDelHogar.reduce((total, gasto) => {
    const deuda = gasto.deudores?.find((deudor) => deudor.usuarioId === user?.id);
    return total + Number(deuda?.montoAdeudado || 0);
  }, 0);
  const pendientes = notificacionesDelHogar.filter((notificacion) => notificacion.estado === "PENDIENTE").length;
  const comprobantesRegistrados = comprobantesDelHogar.length || hogarActual?.comprobanteIds?.length || 0;
  const planActual: PlanId = suscripcion?.plan ?? "GRATIS";
  const titularPremiumHogarId = isPremiumHogar(planActual)
    ? user?.id
    : integrantes.find((usuarioId) => planesIntegrantes[usuarioId] === "PREMIUM_HOGAR");
  const planEfectivo: PlanId = titularPremiumHogarId ? "PREMIUM_HOGAR" : planActual;
  const premiumHogarPorGrupo = isPremiumHogar(planEfectivo) && !isPremiumHogar(planActual);
  const tienePremiumHogar = isPremiumHogar(planEfectivo);

  const proximasTareas = useMemo(() => {
    return tareasDelHogar
      .filter((tarea) => tarea.completada !== true)
      .sort((a, b) => new Date(a.fecha || "").getTime() - new Date(b.fecha || "").getTime())
      .slice(0, 3);
  }, [tareasDelHogar]);

  const usuariosById = useMemo(() => {
    return new Map(data.usuarios.map((usuario) => [usuario.id, usuario]));
  }, [data.usuarios]);
  const titularPremiumHogarNombre = titularPremiumHogarId
    ? getMemberName(titularPremiumHogarId, usuariosById, user || undefined)
    : "";

  const actividadHogar = useMemo(() => {
    const actividades: ActividadHogar[] = [];

    comprobantesDelHogar.forEach((comprobante) => {
      const gasto = gastosDelHogar.find((item) => item.id === comprobante.hogarCuentaId);
      const integrante = getMemberName(comprobante.usuarioId, usuariosById, user || undefined);
      const ruta = comprobante.id
        ? `/comprobantes?comprobante=${comprobante.id}`
        : `/comprobantes?gasto=${comprobante.hogarCuentaId}`;

      actividades.push({
        titulo: `Comprobante registrado: ${gasto?.descripcion || "gasto del hogar"}`,
        detalle: `${integrante} respaldó ${formatCurrency(comprobante.montoPagado)} con ${comprobante.nombreArchivo}.`,
        ruta,
        fecha: comprobante.fechaSubida,
        fechaOrden: getActivityOrder(comprobante.fechaSubida, 10),
      });
    });

    gastosDelHogar.forEach((gasto, index) => {
      const respaldado = comprobantesDelHogar
        .filter((comprobante) => comprobante.hogarCuentaId === gasto.id)
        .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
      const estado = getEstadoRespaldo(Number(gasto.monto || 0), respaldado);

      actividades.push({
        titulo: estado === "RESPALDADO"
          ? `Gasto respaldado: ${getCategoriaLabel(gasto.categoria)}`
          : `Gasto pendiente: ${getCategoriaLabel(gasto.categoria)}`,
        detalle: `${gasto.descripcion} - ${formatCurrency(gasto.monto)} - ${ESTADO_LABELS[estado]}.`,
        ruta: `/comprobantes?gasto=${gasto.id || ""}`,
        fecha: gasto.fechaVencimiento,
        fechaOrden: getActivityOrder(gasto.fechaVencimiento, 100 + index),
      });
    });

    if ((hogarActual?.solicitudesPendientesIds?.length || 0) > 0) {
      actividades.push({
        titulo: "Solicitudes pendientes",
        detalle: `${hogarActual?.solicitudesPendientesIds?.length || 0} persona(s) esperan respuesta del hogar.`,
        ruta: "/notificaciones",
        fechaOrden: getActivityOrder(undefined, 300),
      });
    }

    tareasDelHogar.forEach((tarea, index) => {
      actividades.push({
        titulo: `Tarea próxima: ${tarea.titulo}`,
        detalle: `${tarea.encargado} · ${formatDate(tarea.fecha)}`,
        ruta: "/tareas",
        fecha: tarea.fecha,
        fechaOrden: getActivityOrder(tarea.fecha, 400 + index),
      });
    });

    notificacionesDelHogar
      .filter((notificacion) => ["CUENTA_HOGAR", "TAREA_HOGAR", "SOLICITUD_HOGAR", "INVITACION_HOGAR"].includes(notificacion.tipo) || notificacion.hogarId === hogarActual?.id)
      .forEach((notificacion, index) => {
        actividades.push({
          titulo: notificacion.titulo,
          detalle: notificacion.mensaje,
          ruta: notificacion.tipo === "CUENTA_HOGAR" && notificacion.referenciaId ? `/comprobantes?comprobante=${notificacion.referenciaId}` : "/notificaciones",
          fecha: notificacion.fechaCreacion,
          fechaOrden: getActivityOrder(notificacion.fechaCreacion, 500 + index),
        });
      });

    return actividades
      .sort((a, b) => (b.fechaOrden || 0) - (a.fechaOrden || 0))
      .slice(0, 8);
  }, [comprobantesDelHogar, gastosDelHogar, hogarActual?.id, hogarActual?.solicitudesPendientesIds?.length, notificacionesDelHogar, tareasDelHogar, user, usuariosById]);

  const recomendaciones = useMemo(() => {
    const items: RecomendacionHogar[] = [];

    if (deudaUsuario > 0) {
      items.push({
        titulo: "Revisar deuda asignada",
        detalle: `Hay ${formatCurrency(deudaUsuario)} asignados al usuario actual. Los comprobantes respaldan gastos, no descuentan deuda por persona.`,
        ruta: "/gastos",
      });
    }
    if (gastosPendientes.length > 0) {
      items.push({
        titulo: "Gestionar gastos pendientes",
        detalle: `${gastosPendientes.length} gasto(s) aún necesitan comprobantes suficientes.`,
        ruta: "/gastos",
      });
    }
    if (comprobantesRegistrados === 0) {
      items.push({
        titulo: "Subir comprobantes para respaldar gastos",
        detalle: "Todavía no hay respaldos asociados al hogar.",
        ruta: "/comprobantes",
      });
    }
    if (serviciosBasicosPendientes > 0) {
      items.push({
        titulo: "Revisar servicios básicos",
        detalle: "Hay cuentas de luz, agua, gas, internet o gasto común pendientes.",
        ruta: "/gastos",
      });
    }
    if (tareasActivas === 0) {
      items.push({
        titulo: "Asignar tareas para organizar la convivencia",
        detalle: "Crear tareas ayuda a repartir responsabilidades.",
        ruta: "/tareas",
      });
    }
    if (pendientes === 0) {
      items.push({
        titulo: "No hay avisos pendientes",
        detalle: "El hogar no tiene notificaciones pendientes por revisar.",
      });
    }

    return items;
  }, [comprobantesRegistrados, deudaUsuario, gastosPendientes.length, pendientes, serviciosBasicosPendientes, tareasActivas]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/hogares")}>Mis hogares</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="dashboard-welcome">
        <span className="demo-kicker">Convivencia</span>
        <h1>{hogarActual ? hogarActual.nombre : "Tu grupo roomie"}</h1>
        <p>
          {hogarActual
            ? hogarActual.descripcion || "Resumen operativo del hogar compartido."
            : "Cuando te unas a un hogar, aquí verás integrantes, tareas, gastos, comprobantes y avisos del grupo."}
        </p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <div className="sin-resultados">
          <p>Cargando datos de convivencia...</p>
        </div>
      ) : !hogarActual ? (
        <section className="empty-household">
          <h2>Aún no estás dentro de un grupo roomie</h2>
          <p>
            Crea un hogar o solicita ingreso a uno existente para empezar a organizar tareas,
            gastos y comprobantes con tus compañeros.
          </p>
          <button className="btn btn-success" onClick={() => navigate("/hogares")}>
            Buscar o crear hogar
          </button>
        </section>
      ) : (
        <>
          <section className="household-summary">
            <article className="household-stat">
              <span>Integrantes</span>
              <strong>{integrantes.length}</strong>
            </article>
            <article className="household-stat">
              <span>Tareas activas</span>
              <strong>{tareasActivas}</strong>
            </article>
            {tienePremiumHogar ? (
              <>
            <article className="household-stat">
              <span>Gastos del hogar</span>
              <strong>{formatCurrency(totalGastos)}</strong>
            </article>
            <article className="household-stat">
              <span>Pendiente por respaldar</span>
              <strong>{formatCurrency(totalPendienteGastos)}</strong>
            </article>
            <article className="household-stat">
              <span>Deuda asignada a ti</span>
              <strong>{formatCurrency(deudaUsuario)}</strong>
            </article>
            <article className="household-stat">
              <span>Comprobantes</span>
              <strong>{comprobantesRegistrados}</strong>
            </article>
            <article className="household-stat">
              <span>Actividad reciente</span>
              <strong>{actividadHogar.length}</strong>
            </article>
              </>
            ) : (
              <>
                <article className="household-stat">
                  <span>Gastos registrados</span>
                  <strong>{gastosDelHogar.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Comprobantes</span>
                  <strong>{comprobantesRegistrados}</strong>
                </article>
                <article className="household-stat">
                  <span>Solicitudes</span>
                  <strong>{hogarActual.solicitudesPendientesIds?.length || 0}</strong>
                </article>
              </>
            )}
          </section>

          <section className="dashboard-content">
            <div className="dashboard-activity">
              <div className="section-heading-row">
                <div>
                  <h3>Reportes del hogar</h3>
                  <p>Resumen avanzado de convivencia, gastos, comprobantes y actividad del hogar.</p>
                </div>
                <span className={`plan-badge ${premiumHogarPorGrupo ? "plan-badge-hogar-compartido" : PLAN_BADGE_CLASS[tienePremiumHogar ? "PREMIUM_HOGAR" : planActual]}`}>
                  {premiumHogarPorGrupo ? "Beneficio Premium Hogar del grupo" : tienePremiumHogar ? "Titular Premium Hogar activo" : "Premium Hogar"}
                </span>
              </div>

              {tienePremiumHogar ? (
                <>
                  {premiumHogarPorGrupo && (
                    <p className="api-message">
                      {titularPremiumHogarNombre} es titular de Premium Hogar. Los demás integrantes reciben el beneficio mientras sigan en este hogar, sin aparecer como pagadores del plan.
                    </p>
                  )}
                  <p>
                    Tu hogar tiene {gastosDelHogar.length} gasto(s) este periodo, {formatCurrency(totalPendienteGastos)} pendiente(s)
                    por respaldar y {comprobantesRegistrados} comprobante(s) registrado(s).
                  </p>
                  <div className="module-grid">
                    {recomendaciones.map((recomendacion) => (
                      recomendacion.ruta ? (
                        <button className="module-link" key={recomendacion.titulo} onClick={() => navigate(recomendacion.ruta!)}>
                          <strong>{recomendacion.titulo}</strong>
                          <span>{recomendacion.detalle}</span>
                        </button>
                      ) : (
                        <article className="module-link" key={recomendacion.titulo}>
                          <strong>{recomendacion.titulo}</strong>
                          <span>{recomendacion.detalle}</span>
                        </article>
                      )
                    ))}
                  </div>
                </>
              ) : (
                <div className="sin-resultados">
                  <h4>Reportes avanzados bloqueados</h4>
                  <p>
                    Los reportes del hogar son un beneficio de Premium Hogar. Puedes seguir usando integrantes,
                    tareas, gastos y comprobantes basicos con normalidad. La actividad avanzada queda reservada para Premium Hogar.
                  </p>
                  <button className="btn btn-success" onClick={() => navigate("/planes")}>
                    Mejorar a Premium Hogar
                  </button>
                </div>
              )}
            </div>

            <div className="dashboard-profile">
              <h4>{tienePremiumHogar ? "Indicadores incluidos" : "Indicadores basicos"}</h4>
              <p><strong>Integrantes:</strong> {integrantes.length}</p>
              <p><strong>Tareas activas:</strong> {tareasActivas}</p>
              <p><strong>Comprobantes:</strong> {comprobantesRegistrados}</p>
              {tienePremiumHogar ? (
                <>
                  <p><strong>Respaldo registrado:</strong> {formatCurrency(totalRespaldado)}</p>
                  <p><strong>Gastos pendientes:</strong> {gastosPendientes.length}</p>
                  <p><strong>Actividad reciente:</strong> {actividadHogar.length}</p>
                </>
              ) : (
                <p><strong>Premium Hogar:</strong> reportes, recomendaciones y actividad avanzada no incluidos.</p>
              )}
            </div>
          </section>

          <section className="convivencia-grid">
            <div className="convivencia-main">
              <div className="section-heading-row">
                <div>
                  <h3>Integrantes del hogar</h3>
                  <p>Personas registradas dentro de este grupo de convivencia.</p>
                </div>
                <span className={hogarActual.activo ? "status-pill success" : "status-pill"}>
                  {hogarActual.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="roomie-list">
                {integrantes.map((usuarioId) => {
                  const isAdmin = usuarioId === hogarActual.usuarioAdministradorId;
                  const memberName = getMemberName(usuarioId, usuariosById, user || undefined);
                  const fotoPerfil = usuariosById.get(usuarioId)?.fotoPerfil || (usuarioId === user?.id ? user?.fotoPerfil : "");
                  const planIntegrante = planesIntegrantes[usuarioId];
                  const esTitularPremiumHogar = planIntegrante === "PREMIUM_HOGAR";

                  return (
                    <article className="roomie-card" key={usuarioId}>
                      <div className="roomie-avatar">
                        {fotoPerfil ? <img src={fotoPerfil} alt={memberName} /> : memberName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{memberName}</h4>
                        <span>{isAdmin ? "Administrador del hogar" : "Integrante"}</span>
                        {esTitularPremiumHogar ? (
                          <span className="plan-badge plan-badge-hogar">Titular Premium Hogar</span>
                        ) : planIntegrante ? (
                          <span className={`plan-badge ${PLAN_BADGE_CLASS[planIntegrante]}`}>{PLAN_LABELS[planIntegrante]}</span>
                        ) : (
                          <span className="status-pill">Plan sin confirmar</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="convivencia-side">
              <article className="demo-widget highlight">
                <strong>Solicitudes pendientes</strong>
                <span>{hogarActual.solicitudesPendientesIds?.length || 0} usuario(s) esperando respuesta.</span>
              </article>
              <article className="demo-widget">
                <strong>Comprobantes asociados</strong>
                <span>{hogarActual.comprobanteIds?.length || 0} comprobante(s) registrados en el hogar.</span>
              </article>
              <article className="demo-widget">
                <strong>Publicaciones asociadas</strong>
                <span>{hogarActual.publicacionIds?.length || 0} publicación(es) vinculada(s).</span>
              </article>
            </aside>
          </section>

          <section className="household-panels">
            <article className="household-panel">
              <div className="section-heading-row">
                <h3>Próximas tareas</h3>
                <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/tareas")}>Gestionar</button>
              </div>
              {proximasTareas.length ? (
                proximasTareas.map((tarea) => (
                  <div className="compact-row" key={tarea.id}>
                    <div>
                      <strong>{tarea.titulo}</strong>
                      <span>{tarea.encargado} · {formatDate(tarea.fecha)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">Todavía no hay tareas activas asociadas a este hogar.</p>
              )}
            </article>

            <article className="household-panel">
              <div className="section-heading-row">
                <h3>Gastos compartidos</h3>
                <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/gastos")}>Ver gastos</button>
              </div>
              {gastosDelHogar.length ? (
                gastosDelHogar.slice(0, 3).map((gasto) => {
                  const respaldado = comprobantesDelHogar
                    .filter((comprobante) => comprobante.hogarCuentaId === gasto.id)
                    .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
                  const estado = getEstadoRespaldo(Number(gasto.monto || 0), respaldado);

                  return (
                    <div className="compact-row" key={gasto.id}>
                      <div>
                        <strong>{getCategoriaLabel(gasto.categoria)} · {gasto.descripcion}</strong>
                        <span>{formatCurrency(gasto.monto)} · {ESTADO_LABELS[estado]} · {gasto.periodo || "Sin periodo"}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty-state">No hay gastos asociados a este hogar.</p>
              )}
            </article>

            <article className="household-panel">
              <div className="section-heading-row">
                <h3>Actividad reciente del hogar</h3>
                {tienePremiumHogar && (
                  <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/notificaciones")}>Ver actividad</button>
                )}
              </div>
              {!tienePremiumHogar ? (
                <div className="empty-state">
                  <p>La actividad avanzada del hogar es un beneficio de Premium Hogar. Las notificaciones basicas siguen disponibles.</p>
                  <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/notificaciones")}>Ver notificaciones</button>
                </div>
              ) : actividadHogar.length ? (
                actividadHogar.map((actividad) => (
                  <button className="compact-row" key={`${actividad.titulo}-${actividad.detalle}`} onClick={() => navigate(actividad.ruta)}>
                    <div>
                      <strong>{actividad.titulo}</strong>
                      <span>{actividad.detalle}{actividad.fecha ? ` · ${formatDate(actividad.fecha)}` : ""}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <p>Tu hogar aún no tiene actividad reciente.</p>
                  <div className="dashboard-actions mt-3">
                    <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/gastos")}>Registrar gasto</button>
                    <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/tareas")}>Crear tarea</button>
                    <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/comprobantes")}>Subir comprobante</button>
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className="dashboard-content">
            <div className="dashboard-activity">
              <h4>Acciones para organizar la convivencia</h4>
              <div className="module-grid">
                <button className="module-link" onClick={() => navigate("/tareas")}><strong>Asignar tareas</strong><span>Crear turnos y responsables.</span></button>
                <button className="module-link" onClick={() => navigate("/gastos")}><strong>Registrar gastos</strong><span>Controlar cuentas compartidas.</span></button>
                <button className="module-link" onClick={() => navigate("/comprobantes")}><strong>Subir comprobantes</strong><span>Respaldar gastos con archivos.</span></button>
                <button className="module-link" onClick={() => navigate("/notificaciones")}><strong>Revisar actividad</strong><span>Ver solicitudes, tareas y comprobantes.</span></button>
              </div>
            </div>

            <div className="dashboard-profile">
              <h4>Estado del grupo</h4>
              <p><strong>Administrador:</strong> {getMemberName(hogarActual.usuarioAdministradorId, usuariosById, user || undefined)}</p>
              <p><strong>Creado:</strong> {formatDate(hogarActual.fechaCreacion)}</p>
              <p><strong>ID del hogar:</strong> {hogarActual.id}</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
