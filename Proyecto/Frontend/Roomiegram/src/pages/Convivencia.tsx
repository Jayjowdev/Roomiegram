import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import { isPremiumHogar, membresiaService, PLAN_BADGE_CLASS, type PlanId, type Suscripcion } from "../services/membresiaService";
import { notificacionService } from "../services/notificacionService";
import { tareaService } from "../services/tareaService";
import { usuarioService } from "../services/usuarioService";
import type { HogarCuenta, Notificacion } from "../types/Backend";
import type { Hogar } from "../types/Hogar";
import type { Tarea } from "../types/Tarea";
import type { UsuarioResumen } from "../types/Usuario";

type LoadState = {
  hogares: Hogar[];
  tareas: Tarea[];
  gastos: HogarCuenta[];
  notificaciones: Notificacion[];
  usuarios: UsuarioResumen[];
};

type RecomendacionHogar = {
  titulo: string;
  detalle: string;
  ruta?: string;
};

const emptyState: LoadState = {
  hogares: [],
  tareas: [],
  gastos: [],
  notificaciones: [],
  usuarios: [],
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

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      hogarService.listar(),
      tareaService.listar(),
      gastoService.listar(),
      notificacionService.listar(),
      usuarioService.listar(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
    ]).then(([hogaresResult, tareasResult, gastosResult, notificacionesResult, usuariosResult, suscripcionResult]) => {
      if (!isMounted) return;

      const partialData: LoadState = {
        hogares: hogaresResult.status === "fulfilled" ? hogaresResult.value : [],
        tareas: tareasResult.status === "fulfilled" ? tareasResult.value : [],
        gastos: gastosResult.status === "fulfilled" ? gastosResult.value : [],
        notificaciones:
          notificacionesResult.status === "fulfilled" ? notificacionesResult.value : [],
        usuarios: usuariosResult.status === "fulfilled" ? usuariosResult.value : [],
      };

      setData(partialData);
      if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
        setSuscripcion(suscripcionResult.value as Suscripcion);
      }
      setIsLoading(false);

      if ([hogaresResult, tareasResult, gastosResult, notificacionesResult, usuariosResult].some((result) => result.status === "rejected")) {
        setMessage("Algunos datos del hogar no se pudieron cargar. Revisa que los microservicios estén activos.");
      } else {
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
  const deudaUsuario = gastosDelHogar.reduce((total, gasto) => {
    const deuda = gasto.deudores?.find((deudor) => deudor.usuarioId === user?.id);
    return total + Number(deuda?.montoAdeudado || 0);
  }, 0);
  const pendientes = notificacionesDelHogar.filter((notificacion) => notificacion.estado === "PENDIENTE").length;
  const comprobantesRegistrados = hogarActual?.comprobanteIds?.length || 0;
  const planActual: PlanId = suscripcion?.plan ?? "GRATIS";
  const tienePremiumHogar = isPremiumHogar(planActual);

  const proximasTareas = useMemo(() => {
    return tareasDelHogar
      .filter((tarea) => tarea.completada !== true)
      .sort((a, b) => new Date(a.fecha || "").getTime() - new Date(b.fecha || "").getTime())
      .slice(0, 3);
  }, [tareasDelHogar]);

  const avisosPendientes = useMemo(() => {
    return notificacionesDelHogar
      .filter((notificacion) => notificacion.estado === "PENDIENTE")
      .slice(0, 3);
  }, [notificacionesDelHogar]);

  const recomendaciones = useMemo(() => {
    const items: RecomendacionHogar[] = [];

    if (deudaUsuario > 0) {
      items.push({
        titulo: "Revisar pagos pendientes",
        detalle: "Hay deuda registrada en el hogar.",
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
  }, [comprobantesRegistrados, deudaUsuario, pendientes, tareasActivas]);

  const usuariosById = useMemo(() => {
    return new Map(data.usuarios.map((usuario) => [usuario.id, usuario]));
  }, [data.usuarios]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
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
            : "Cuando te unas a un hogar, aquí verás integrantes, tareas, gastos, pagos y avisos del grupo."}
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
            <article className="household-stat">
              <span>Gastos del hogar</span>
              <strong>{formatCurrency(totalGastos)}</strong>
            </article>
            <article className="household-stat">
              <span>Tu deuda registrada</span>
              <strong>{formatCurrency(deudaUsuario)}</strong>
            </article>
            <article className="household-stat">
              <span>Avisos pendientes</span>
              <strong>{pendientes}</strong>
            </article>
          </section>

          <section className="dashboard-content">
            <div className="dashboard-activity">
              <div className="section-heading-row">
                <div>
                  <h3>Reportes del hogar</h3>
                  <p>Resumen avanzado de convivencia, gastos, comprobantes y avisos.</p>
                </div>
                <span className={`plan-badge ${PLAN_BADGE_CLASS[tienePremiumHogar ? "PREMIUM_HOGAR" : planActual]}`}>
                  {tienePremiumHogar ? "Premium Hogar activo" : "Premium Hogar"}
                </span>
              </div>

              {tienePremiumHogar ? (
                <>
                  <p>
                    Tu hogar tiene {integrantes.length} integrante(s), {tareasActivas} tarea(s) activa(s),{" "}
                    {formatCurrency(totalGastos)} en gastos y {comprobantesRegistrados} comprobante(s) registrado(s).
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
                    tareas, gastos, comprobantes y avisos con normalidad.
                  </p>
                  <button className="btn btn-success" onClick={() => navigate("/planes")}>
                    Mejorar a Premium Hogar
                  </button>
                </div>
              )}
            </div>

            <div className="dashboard-profile">
              <h4>Indicadores incluidos</h4>
              <p><strong>Integrantes:</strong> {integrantes.length}</p>
              <p><strong>Tareas activas:</strong> {tareasActivas}</p>
              <p><strong>Comprobantes:</strong> {comprobantesRegistrados}</p>
              <p><strong>Avisos pendientes:</strong> {pendientes}</p>
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

                  return (
                    <article className="roomie-card" key={usuarioId}>
                      <div className="roomie-avatar">
                        {fotoPerfil ? <img src={fotoPerfil} alt={memberName} /> : memberName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{memberName}</h4>
                        <span>{isAdmin ? "Administrador del hogar" : "Integrante"}</span>
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
                <span>{hogarActual.comprobanteIds?.length || 0} pago(s) registrados en el hogar.</span>
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
                gastosDelHogar.slice(0, 3).map((gasto) => (
                  <div className="compact-row" key={gasto.id}>
                    <div>
                      <strong>{gasto.descripcion}</strong>
                      <span>{formatCurrency(gasto.monto)} · {gasto.deudores?.length || 0} deudor(es)</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay gastos asociados a este hogar.</p>
              )}
            </article>

            <article className="household-panel">
              <div className="section-heading-row">
                <h3>Avisos del grupo</h3>
                <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/notificaciones")}>Ver avisos</button>
              </div>
              {avisosPendientes.length ? (
                avisosPendientes.map((notificacion) => (
                  <div className="compact-row" key={notificacion.id || notificacion.titulo}>
                    <div>
                      <strong>{notificacion.titulo}</strong>
                      <span>{notificacion.estado} · {notificacion.mensaje}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay avisos pendientes para este hogar.</p>
              )}
            </article>
          </section>

          <section className="dashboard-content">
            <div className="dashboard-activity">
              <h4>Acciones para organizar la convivencia</h4>
              <div className="module-grid">
                <button className="module-link" onClick={() => navigate("/tareas")}><strong>Asignar tareas</strong><span>Crear turnos y responsables.</span></button>
                <button className="module-link" onClick={() => navigate("/gastos")}><strong>Registrar gastos</strong><span>Controlar cuentas compartidas.</span></button>
                <button className="module-link" onClick={() => navigate("/comprobantes")}><strong>Subir comprobantes</strong><span>Respaldar pagos realizados.</span></button>
                <button className="module-link" onClick={() => navigate("/notificaciones")}><strong>Revisar avisos</strong><span>Ver recordatorios del hogar.</span></button>
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
