import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
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

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      hogarService.listar(),
      tareaService.listar(),
      gastoService.listar(),
      notificacionService.listar(),
      usuarioService.listar(),
    ]).then(([hogaresResult, tareasResult, gastosResult, notificacionesResult, usuariosResult]) => {
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
  }, []);

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

  const totalGastos = gastosDelHogar.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);
  const deudaUsuario = gastosDelHogar.reduce((total, gasto) => {
    const deuda = gasto.deudores?.find((deudor) => deudor.usuarioId === user?.id);
    return total + Number(deuda?.montoAdeudado || 0);
  }, 0);
  const pendientes = notificacionesDelHogar.filter((notificacion) => notificacion.estado === "PENDIENTE").length;

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
              <strong>{tareasDelHogar.length}</strong>
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
              {tareasDelHogar.length ? (
                tareasDelHogar.slice(0, 3).map((tarea) => (
                  <div className="compact-row" key={tarea.id}>
                    <div>
                      <strong>{tarea.titulo}</strong>
                      <span>{tarea.encargado} · {formatDate(tarea.fecha)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">Todavía no hay tareas asociadas a este hogar.</p>
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
              {notificacionesDelHogar.length ? (
                notificacionesDelHogar.slice(0, 3).map((notificacion) => (
                  <div className="compact-row" key={notificacion.id || notificacion.titulo}>
                    <div>
                      <strong>{notificacion.titulo}</strong>
                      <span>{notificacion.estado} · {notificacion.mensaje}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay notificaciones para este hogar.</p>
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
