import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import type { Notificacion } from "../types/Backend";
import type { Hogar } from "../types/Hogar";

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
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [filters, setFilters] = useState(filterDefaults);
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([notificacionService.listar(), hogarService.listar()])
      .then(([data, hogaresData]) => {
        setNotificaciones(data);
        setHogares(hogaresData);
        setMessage("");
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

  const getHogarNotificacion = (notificacion: Notificacion) => {
    return hogares.find((hogar) => hogar.id === notificacion.hogarId);
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
        (notificacion.tipo === "INVITACION_HOGAR" || notificacion.tipo === "TAREA_HOGAR");

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
        const actualizado = await hogarService.aprobarSolicitud(notificacion.hogarId, notificacion.usuarioEmisorId, {
          administradorId: user.id,
        });
        setHogares((current) => current.map((item) => item.id === actualizado.id ? actualizado : item));
        setMessage("Solicitud aceptada. La persona ya forma parte de tu grupo.");
      } else {
        const administradorId = hogar?.usuarioAdministradorId || notificacion.usuarioEmisorId;

        try {
          await hogarService.solicitarIngreso(notificacion.hogarId, { usuarioId: user.id });
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : "";
          if (!mensaje.includes("Ya tienes una solicitud") && !mensaje.includes("Ya formas parte")) {
            throw error;
          }
        }

        try {
          const actualizado = await hogarService.aprobarSolicitud(notificacion.hogarId, user.id, {
            administradorId,
          });
          setHogares((current) => current.map((item) => item.id === actualizado.id ? actualizado : item));
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : "";
          if (!mensaje.includes("Ya formas parte")) {
            throw error;
          }
        }

        setMessage("Invitacion aceptada. Ya formas parte del grupo.");
      }

      await notificacionService.eliminar(notificacion.id);
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
        const actualizado = await hogarService.rechazarSolicitud(notificacion.hogarId, notificacion.usuarioEmisorId, {
          administradorId: user.id,
        });
        setHogares((current) => current.map((item) => item.id === actualizado.id ? actualizado : item));
      }

      await notificacionService.eliminar(notificacion.id);
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
      setMessage("Tarea marcada como revisada.");
    } catch {
      setMessage("No se pudo actualizar la notificacion de tarea.");
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
        <h3>Tareas asignadas pendientes</h3>
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
                  {processingId === notificacion.id ? "Actualizando..." : "Marcar como revisada"}
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
            const esSolicitud = esSolicitudRecibida(notificacion);

            return (
              <article className="module-item" key={notificacion.id || notificacion.titulo}>
                <h4>{esSolicitud ? "Solicitud para tu grupo" : notificacion.titulo}</h4>
                <p>{notificacion.mensaje}</p>
                <span>
                  {esSolicitud ? "Solicitud de ingreso" : formatLabel(notificacion.tipo)} - {formatDate(notificacion.fechaCreacion)}
                </span>
              <div className="dashboard-actions mt-3">
                <button
                  className="btn btn-success btn-sm"
                  disabled={processingId === notificacion.id}
                  onClick={() => aceptarNotificacionPendiente(notificacion)}
                >
                  {processingId === notificacion.id ? "Aceptando..." : "Aceptar"}
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
        ) : notificacionesFiltradas.map((notificacion) => (
          <article className="module-item" key={notificacion.id || notificacion.titulo}>
            <h4>{notificacion.titulo}</h4>
            <p>{notificacion.mensaje}</p>
            <span>{formatLabel(notificacion.tipo)} - {formatLabel(notificacion.estado)} - {formatDate(notificacion.fechaCreacion)}</span>
          </article>
        ))}
      </section>
    </div>
  );
}
