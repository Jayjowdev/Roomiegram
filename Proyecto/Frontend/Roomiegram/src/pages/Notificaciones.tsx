import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Notificacion } from "../types/Backend";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import {
  aceptarInvitacionHogar,
  aceptarSolicitudIngreso,
  rechazarInvitacionHogar,
  rechazarSolicitudIngreso,
} from "../utils/notificacionActions";

const filterDefaults = {
  busqueda: "",
  tipo: "todos",
  estado: "todos",
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("es-CL") : "Sin fecha";
}

function normalize(value?: string | number) {
  return String(value ?? "").toLowerCase().trim();
}

function formatLabel(value: string) {
  if (value === "INTERES_ROOMIE") return "Interés roomie";
  if (value === "INVITACION_HOGAR") return "Invitación hogar";
  if (value === "TAREA_HOGAR") return "Tarea hogar";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTelefonoContacto(telefono?: string) {
  const value = telefono?.trim();
  return value || "Teléfono no informado";
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [filters, setFilters] = useState(filterDefaults);
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.allSettled([
      notificacionService.listar(),
      hogarService.listar(),
      usuarioService.listar(),
      publicacionService.listar(),
    ])
      .then(([notificacionesResult, hogaresResult, usuariosResult, publicacionesResult]) => {
        if (notificacionesResult.status === "fulfilled") setNotificaciones(notificacionesResult.value);
        if (hogaresResult.status === "fulfilled") setHogares(hogaresResult.value);
        if (usuariosResult.status === "fulfilled") setUsuarios(usuariosResult.value);
        if (publicacionesResult.status === "fulfilled") setPublicaciones(publicacionesResult.value);
        setMessage("");
        if ([notificacionesResult, hogaresResult, usuariosResult, publicacionesResult].some((result) => result.status === "rejected")) {
          setMessage("Algunos datos de contexto no se pudieron cargar.");
        }
      })
      .catch(() => setMessage("Servicio no disponible. Intenta nuevamente."));
  }, []);

  const misNotificaciones = useMemo(() => {
    if (!user?.id) return [];
    return notificaciones.filter((notificacion) => notificacion.usuarioReceptorId === user.id);
  }, [notificaciones, user?.id]);

  const invitacionesPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "INVITACION_HOGAR" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const tareasPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "TAREA_HOGAR" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const interesesPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "INTERES_ROOMIE" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const getHogarNotificacion = (notificacion: Notificacion) => {
    return hogares.find((hogar) => hogar.id === notificacion.hogarId);
  };

  const getUsuario = (usuarioId: number) => {
    return usuarios.find((usuario) => usuario.id === usuarioId);
  };

  const getPublicacionDelHogar = (hogar?: Hogar) => {
    const publicacionId = hogar?.publicacionIds?.[0];
    if (!publicacionId) return undefined;
    return publicaciones.find((publicacion) => publicacion.id === publicacionId);
  };

  const esAdminDelHogar = (hogar?: Hogar) => {
    return !!user?.id && !!hogar && (
      hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id
    );
  };

  const esSolicitudRecibida = (notificacion: Notificacion) => {
    const hogar = getHogarNotificacion(notificacion);
    return esAdminDelHogar(hogar) && hogar?.solicitudesPendientesIds?.includes(notificacion.usuarioEmisorId);
  };

  const getNotificationContext = (notificacion: Notificacion) => {
    const hogar = getHogarNotificacion(notificacion);
    const emisor = getUsuario(notificacion.usuarioEmisorId);
    const publicacion = getPublicacionDelHogar(hogar);
    const esSolicitud = esSolicitudRecibida(notificacion);

    return {
      hogar,
      emisor,
      publicacion,
      esSolicitud,
      nombreEmisor: emisor?.nombre || emisor?.usuario || `Usuario #${notificacion.usuarioEmisorId}`,
    };
  };

  const buildInterestParams = (notificacion: Notificacion) => {
    const params = new URLSearchParams({
      from: "notificaciones",
      tipoAccion: "interes",
      usuarioId: String(notificacion.usuarioEmisorId),
    });

    if (notificacion.id) params.set("notificacionId", String(notificacion.id));
    if (notificacion.referenciaId) params.set("referenciaId", String(notificacion.referenciaId));

    return params.toString();
  };

  const buildNotificationParams = (notificacion: Notificacion, publicacion?: Publicacion, esSolicitud?: boolean) => {
    const params = new URLSearchParams({
      from: "notificaciones",
      tipoAccion: esSolicitud ? "solicitud" : "invitacion",
      hogarId: String(notificacion.hogarId),
      usuarioId: String(notificacion.usuarioEmisorId),
    });

    if (notificacion.id) params.set("notificacionId", String(notificacion.id));
    if (publicacion?.id) params.set("publicacionId", String(publicacion.id));

    return params.toString();
  };

  const tiposDisponibles = useMemo(
    () => [...new Set(misNotificaciones.map((notificacion) => notificacion.tipo).filter(Boolean))],
    [misNotificaciones],
  );

  const estadosDisponibles = useMemo(
    () => [...new Set(misNotificaciones.map((notificacion) => notificacion.estado).filter(Boolean))],
    [misNotificaciones],
  );

  const notificacionesFiltradas = useMemo(() => {
    const termino = normalize(filters.busqueda);

    return misNotificaciones.filter((notificacion) => {
      const yaEstaDestacada =
        notificacion.estado === "PENDIENTE" &&
        (notificacion.tipo === "INVITACION_HOGAR" || notificacion.tipo === "TAREA_HOGAR" || notificacion.tipo === "INTERES_ROOMIE");

      if (yaEstaDestacada) return false;

      const coincideTipo = filters.tipo === "todos" || notificacion.tipo === filters.tipo;
      const coincideEstado = filters.estado === "todos" || notificacion.estado === filters.estado;
      const contenido = [
        notificacion.titulo,
        notificacion.mensaje,
        notificacion.tipo,
        notificacion.estado,
        notificacion.hogarId,
        formatDate(notificacion.fechaCreacion),
      ].map(normalize).join(" ");

      return coincideTipo && coincideEstado && (!termino || contenido.includes(termino));
    });
  }, [filters, misNotificaciones]);

  const hasActiveFilters =
    Boolean(filters.busqueda.trim()) || filters.tipo !== "todos" || filters.estado !== "todos";

  const aceptarNotificacionPendiente = async (notificacion: Notificacion) => {
    if (!user?.id || !notificacion.id) return;
    const hogar = getHogarNotificacion(notificacion);

    try {
      setProcessingId(notificacion.id);

      if (esSolicitudRecibida(notificacion)) {
        const resultado = await aceptarSolicitudIngreso({
          hogarId: notificacion.hogarId,
          solicitanteId: notificacion.usuarioEmisorId,
          administradorId: user.id,
          notificacionId: notificacion.id,
          hogarNombre: hogar?.nombre,
        });
        if (resultado.hogar) {
          setHogares((current) => current.map((item) => item.id === resultado.hogar?.id ? resultado.hogar : item));
        }
        setMessage(resultado.message);
      } else {
        const resultado = await aceptarInvitacionHogar({
          hogarId: notificacion.hogarId,
          usuarioId: user.id,
          administradorId: hogar?.usuarioAdministradorId || notificacion.usuarioEmisorId,
          notificacionId: notificacion.id,
        });
        if (resultado.hogar) {
          setHogares((current) => current.map((item) => item.id === resultado.hogar?.id ? resultado.hogar : item));
        }
        setMessage(resultado.message);
      }

      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aceptar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const rechazarNotificacionPendiente = async (notificacion: Notificacion) => {
    if (!notificacion.id) return;

    try {
      setProcessingId(notificacion.id);
      if (user?.id && esSolicitudRecibida(notificacion)) {
        const hogar = getHogarNotificacion(notificacion);
        const resultado = await rechazarSolicitudIngreso({
          hogarId: notificacion.hogarId,
          solicitanteId: notificacion.usuarioEmisorId,
          administradorId: user.id,
          notificacionId: notificacion.id,
          hogarNombre: hogar?.nombre,
        });
        if (resultado.hogar) {
          setHogares((current) => current.map((item) => item.id === resultado.hogar?.id ? resultado.hogar : item));
        }
      } else {
        await rechazarInvitacionHogar({ notificacionId: notificacion.id });
      }

      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
      setMessage(esSolicitudRecibida(notificacion) ? "Solicitud rechazada." : "Invitacion rechazada.");
    } catch {
      setMessage("No se pudo rechazar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const cerrarTareaPendiente = async (notificacion: Notificacion) => {
    if (!notificacion.id) return;

    try {
      setProcessingId(notificacion.id);
      await notificacionService.eliminar(notificacion.id);
      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
      setMessage("Notificacion marcada como leida.");
    } catch {
      setMessage("No se pudo actualizar la notificacion de tarea.");
    } finally {
      setProcessingId(null);
    }
  };

  const descartarNotificacion = async (notificacion: Notificacion) => {
    if (!notificacion.id) return;

    try {
      setProcessingId(notificacion.id);
      await notificacionService.eliminar(notificacion.id);
      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
      setMessage("Notificación descartada.");
    } catch {
      setMessage("No se pudo completar la acción. Intenta nuevamente.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Notificaciones</h1>
        <p>Revisa invitaciones, solicitudes y avisos importantes de convivencia.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-list mb-4">
        <h3>Tareas y avisos pendientes</h3>
        {tareasPendientes.length === 0 ? (
          <div className="sin-resultados"><p>No tienes tareas asignadas pendientes.</p></div>
        ) : (
          tareasPendientes.map((notificacion) => (
            <article className="module-item notification-highlight" key={notificacion.id || notificacion.titulo}>
              <h4>{notificacion.titulo}</h4>
              <p>{notificacion.mensaje}</p>
              <span>{formatLabel(notificacion.tipo)} - {formatDate(notificacion.fechaCreacion)}</span>
              <div className="dashboard-actions mt-3">
                <button className="btn btn-success btn-sm" onClick={() => navigate("/tareas")}>
                  Ver tareas
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  disabled={processingId === notificacion.id}
                  onClick={() => cerrarTareaPendiente(notificacion)}
                >
                  {processingId === notificacion.id ? "Actualizando..." : "Marcar como leida"}
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="module-list mb-4">
        <h3>Solicitudes e invitaciones pendientes</h3>
        {invitacionesPendientes.length === 0 ? (
          <div className="sin-resultados"><p>No tienes solicitudes pendientes.</p></div>
        ) : (
          invitacionesPendientes.map((notificacion) => {
            const { esSolicitud, hogar, emisor, publicacion, nombreEmisor } = getNotificationContext(notificacion);

            return (
              <article className="module-item notification-context-card" key={notificacion.id || notificacion.titulo}>
                <div className="notification-context-head">
                  <div className="notification-avatar">
                    {(emisor?.nombre || emisor?.usuario || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="eyebrow">{esSolicitud ? "Solicitud de ingreso" : "Invitacion recibida"}</span>
                    <h4>{esSolicitud ? `${nombreEmisor} quiere unirse` : `${nombreEmisor} te invito a un hogar`}</h4>
                    <p>{notificacion.mensaje}</p>
                  </div>
                </div>

                <div className="notification-context-grid">
                  <span><strong>Persona:</strong> {nombreEmisor}</span>
                  <span><strong>Hogar:</strong> {hogar?.nombre || `#${notificacion.hogarId}`}</span>
                  <span><strong>Fecha:</strong> {formatDate(notificacion.fechaCreacion)}</span>
                  <span><strong>Estado:</strong> {formatLabel(notificacion.estado)}</span>
                  {publicacion && <span><strong>Publicacion:</strong> {publicacion.titulo || "Casa disponible"}</span>}
                </div>

                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(`/perfil-publico/${notificacion.usuarioEmisorId}?${buildNotificationParams(notificacion, publicacion, esSolicitud)}`)}
                  >
                    Ver perfil
                  </button>
                  {publicacion && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => navigate(`/detalle-publicacion/${publicacion.id}?${buildNotificationParams(notificacion, publicacion, esSolicitud)}`)}
                    >
                      Ver publicacion de casa
                    </button>
                  )}
                  <button
                    className="btn btn-success btn-sm"
                    disabled={processingId === notificacion.id}
                    onClick={() => aceptarNotificacionPendiente(notificacion)}
                  >
                    {processingId === notificacion.id ? "Aceptando..." : esSolicitud ? "Aceptar solicitud" : "Aceptar invitacion"}
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    disabled={processingId === notificacion.id}
                    onClick={() => rechazarNotificacionPendiente(notificacion)}
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {interesesPendientes.length > 0 && (
        <section className="module-list mb-4">
          <h3>Intereses recibidos</h3>
          {interesesPendientes.map((notificacion) => {
            const emisor = getUsuario(notificacion.usuarioEmisorId);
            const nombreEmisor = emisor?.nombre || emisor?.usuario || `Usuario #${notificacion.usuarioEmisorId}`;

            return (
              <article className="module-item notification-interest-card" key={notificacion.id || notificacion.titulo}>
                <div className="notification-context-head">
                  <div className="notification-avatar">
                    {nombreEmisor.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="eyebrow">Interés recibido</span>
                    <h4>Esta notificación pertenece a una función que ya no está activa.</h4>
                    <p>{nombreEmisor} mostró interés en conectar contigo. Puedes revisar su perfil o descartar este aviso.</p>
                  </div>
                </div>

                <div className="notification-context-grid">
                  <span><strong>Persona:</strong> {nombreEmisor}</span>
                  <span><strong>Teléfono:</strong> {getTelefonoContacto(emisor?.telefono)}</span>
                  <span><strong>Fecha:</strong> {formatDate(notificacion.fechaCreacion)}</span>
                  <span><strong>Estado:</strong> {formatLabel(notificacion.estado)}</span>
                </div>

                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(`/perfil-publico/${notificacion.usuarioEmisorId}?${buildInterestParams(notificacion)}`)}
                  >
                    Ver perfil
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={processingId === notificacion.id}
                    onClick={() => descartarNotificacion(notificacion)}
                  >
                    Descartar
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="module-list">
        <h3>Mis avisos</h3>
        <div className="notification-filters">
          <input
            className="form-control"
            placeholder="Buscar por titulo, mensaje, hogar o fecha"
            value={filters.busqueda}
            onChange={(e) => setFilters((current) => ({ ...current, busqueda: e.target.value }))}
          />
          <div className="form-row">
            <select
              className="form-control"
              value={filters.tipo}
              onChange={(e) => setFilters((current) => ({ ...current, tipo: e.target.value }))}
            >
              <option value="todos">Todos los tipos</option>
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>{formatLabel(tipo)}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={filters.estado}
              onChange={(e) => setFilters((current) => ({ ...current, estado: e.target.value }))}
            >
              <option value="todos">Todos los estados</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>{formatLabel(estado)}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-actions">
            <span className="empty-state">
              {notificacionesFiltradas.length} de {misNotificaciones.length} avisos
            </span>
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setFilters(filterDefaults)}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {misNotificaciones.length === 0 ? (
          <div className="sin-resultados"><p>No tienes notificaciones por ahora.</p></div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="sin-resultados"><p>No se encontraron avisos con esos filtros.</p></div>
        ) : notificacionesFiltradas.map((notificacion) => {
          const esInteres = notificacion.tipo === "INTERES_ROOMIE";
          const emisor = esInteres ? getUsuario(notificacion.usuarioEmisorId) : undefined;

          return (
            <article className="module-item" key={notificacion.id || notificacion.titulo}>
              <h4>{notificacion.titulo}</h4>
              <p>{notificacion.mensaje}</p>
              {esInteres && (
                <div className="notification-context-grid mt-2">
                  <span><strong>Persona:</strong> {emisor?.nombre || emisor?.usuario || `Usuario #${notificacion.usuarioEmisorId}`}</span>
                  <span><strong>Teléfono:</strong> {getTelefonoContacto(emisor?.telefono)}</span>
                </div>
              )}
              <span>{formatLabel(notificacion.tipo)} - {formatLabel(notificacion.estado)} - {formatDate(notificacion.fechaCreacion)}</span>
              {esInteres && (
                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(`/perfil-publico/${notificacion.usuarioEmisorId}?${buildInterestParams(notificacion)}`)}
                  >
                    Ver perfil
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={processingId === notificacion.id}
                    onClick={() => descartarNotificacion(notificacion)}
                  >
                    Descartar
                  </button>
                </div>
              )}
              {!esInteres && (
                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={processingId === notificacion.id}
                    onClick={() => descartarNotificacion(notificacion)}
                  >
                    Descartar
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
