import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";
import { deleteLocalPublicacion } from "../utils/localPublicaciones";

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return (
    hogar.integrantesIds?.includes(userId) ||
    hogar.usuarioAdministradorId === userId ||
    hogar.usuarioCreadorId === userId
  );
}

function userRequestedHogar(hogar: Hogar, userId?: number) {
  return !!userId && hogar.solicitudesPendientesIds?.includes(userId);
}

function isHogarAdmin(hogar: Hogar, userId?: number) {
  return !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function isSeedHogar(hogar: Hogar) {
  const descripcion = hogar.descripcion?.toLowerCase().trim() || "";
  const nombre = hogar.nombre?.toLowerCase().trim() || "";

  return (
    descripcion.includes("hogar inicial de ejemplo") ||
    descripcion.includes("pruebas del microservicio") ||
    nombre === "hogar de ejemplo"
  );
}

function formatMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string }
) {
  if (usuarioId === currentUser?.id) {
    return currentUser.nombre || currentUser.usuario || "Tú";
  }

  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || "Integrante del hogar";
}

export default function Hogares() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState("");

  const loadHogares = () => {
    setIsLoading(true);
    Promise.allSettled([hogarService.listar(), usuarioService.listar()])
      .then(([hogaresResult, usuariosResult]) => {
        const hogaresData = hogaresResult.status === "fulfilled"
          ? hogaresResult.value.filter((hogar) => !isSeedHogar(hogar))
          : [];

        setHogares(hogaresData);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

        if (hogaresResult.status === "rejected") {
          setMessage("Servicio no disponible. Intenta nuevamente.");
        } else {
          setMessage(hogaresData.length ? "" : "No hay hogares registrados.");
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadHogares, []);

  const misHogares = useMemo(() => {
    return hogares.filter((hogar) => userBelongsToHogar(hogar, user?.id));
  }, [hogares, user?.id]);

  const solicitudesPendientes = useMemo(() => {
    return hogares.filter((hogar) => userRequestedHogar(hogar, user?.id));
  }, [hogares, user?.id]);

  const hogaresDisponibles = useMemo(() => {
    return hogares.filter((hogar) => {
      return !userBelongsToHogar(hogar, user?.id) && !userRequestedHogar(hogar, user?.id);
    });
  }, [hogares, user?.id]);

  const canCreateHogar = misHogares.length === 0;

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const updateHogar = (hogarActualizado: Hogar) => {
    setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!user?.id) {
      setMessage("Debes iniciar sesión para crear un hogar.");
      return;
    }

    if (!canCreateHogar) {
      setMessage("Ya perteneces a un hogar. Usa el panel de convivencia para organizar tu grupo.");
      return;
    }

    if (nombre.trim().length < 3) {
      setMessage("El nombre del hogar debe tener al menos 3 caracteres.");
      return;
    }

    if (descripcion.trim() && descripcion.trim().length < 10) {
      setMessage("La descripción debe tener al menos 10 caracteres o quedar vacía.");
      return;
    }

    setIsSaving(true);

    try {
      const creado = await hogarService.crear({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        usuarioCreadorId: user.id,
      });
      setHogares((current) => [...current, creado]);
      setMessage("Hogar creado correctamente.");
      setNombre("");
      setDescripcion("");
    } catch {
      setMessage("Servicio no disponible. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const solicitarIngreso = async (hogarId: number) => {
    if (!user?.id) {
      setMessage("Debes iniciar sesión para solicitar ingreso.");
      return;
    }

    const requestKey = `solicitar-${hogarId}`;
    const hogar = hogares.find((item) => item.id === hogarId);
    const usuarioReceptorId = hogar?.usuarioAdministradorId || hogar?.usuarioCreadorId;

    try {
      setProcessingRequest(requestKey);
      const actualizado = await hogarService.solicitarIngreso(hogarId, { usuarioId: user.id });
      updateHogar(actualizado);
      let avisosEnviados = true;

      if (usuarioReceptorId) {
        try {
          await notificacionService.crear({
            usuarioEmisorId: user.id,
            usuarioReceptorId,
            hogarId,
            referenciaId: user.id,
            tipo: "INVITACION_HOGAR",
            estado: "PENDIENTE",
            titulo: "Solicitud de ingreso pendiente",
            mensaje: `${user.nombre || user.usuario || "Un usuario"} esta solicitando una revision al hogar ${hogar?.nombre || "seleccionado"}.`,
          });
        } catch {
          avisosEnviados = false;
        }

        try {
          const correo = await usuarioService.enviarCorreoSolicitudRecibida({
            usuarioReceptorId,
            usuarioSolicitanteId: user.id,
            solicitanteNombre: user.nombre || user.usuario,
            hogarNombre: hogar?.nombre,
          });
          avisosEnviados = avisosEnviados && correo.enviado;
        } catch {
          avisosEnviados = false;
        }
      }

      setMessage(!usuarioReceptorId
        ? "Solicitud enviada correctamente."
        : avisosEnviados
          ? "Solicitud enviada correctamente. Se notifico al administrador del hogar."
          : "Solicitud enviada correctamente, pero no se pudo enviar alguno de los avisos.");
    } catch {
      setMessage("No se pudo enviar la solicitud. Revisa que el servicio esté disponible.");
    } finally {
      setProcessingRequest("");
    }
  };

  const aprobarSolicitud = async (hogarId: number, usuarioId: number) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(`aprobar-${hogarId}-${usuarioId}`);
      const hogar = hogares.find((item) => item.id === hogarId);
      const actualizado = await hogarService.aprobarSolicitud(hogarId, usuarioId, { administradorId: user.id });
      updateHogar(actualizado);
      let correoEnviado = true;
      try {
        const correo = await usuarioService.enviarCorreoSolicitudResuelta({
          usuarioSolicitanteId: usuarioId,
          administradorId: user.id,
          hogarNombre: hogar?.nombre || actualizado.nombre,
          aceptada: true,
        });
        correoEnviado = correo.enviado;
      } catch {
        correoEnviado = false;
      }
      setMessage(correoEnviado
        ? "Solicitud aprobada. Se aviso al solicitante por correo."
        : "Solicitud aprobada, pero no se pudo enviar el correo al solicitante.");
    } catch {
      setMessage("No se pudo aprobar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  const rechazarSolicitud = async (hogarId: number, usuarioId: number) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(`rechazar-${hogarId}-${usuarioId}`);
      const hogar = hogares.find((item) => item.id === hogarId);
      const actualizado = await hogarService.rechazarSolicitud(hogarId, usuarioId, { administradorId: user.id });
      updateHogar(actualizado);
      let correoEnviado = true;
      try {
        const correo = await usuarioService.enviarCorreoSolicitudResuelta({
          usuarioSolicitanteId: usuarioId,
          administradorId: user.id,
          hogarNombre: hogar?.nombre || actualizado.nombre,
          aceptada: false,
        });
        correoEnviado = correo.enviado;
      } catch {
        correoEnviado = false;
      }
      setMessage(correoEnviado
        ? "Solicitud rechazada. Se aviso al solicitante por correo."
        : "Solicitud rechazada, pero no se pudo enviar el correo al solicitante.");
    } catch {
      setMessage("No se pudo rechazar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  const eliminarHogar = async (hogar: Hogar) => {
    if (!user?.id) return;
    const publicacionesAsociadas = hogar.publicacionIds || [];

    try {
      await hogarService.eliminar(hogar.id, user.id);
      setHogares((current) => current.filter((item) => item.id !== hogar.id));

      if (publicacionesAsociadas.length === 0) {
        setMessage("Hogar eliminado correctamente.");
        return;
      }

      const resultados = await Promise.allSettled(
        publicacionesAsociadas.map((publicacionId) =>
          publicacionService.eliminar(publicacionId, user.usuario, user.role || "CLIENTE")
        )
      );

      publicacionesAsociadas.forEach((publicacionId) => deleteLocalPublicacion(publicacionId));

      const fallidas = resultados.filter((result) => result.status === "rejected").length;
      setMessage(
        fallidas
          ? "Hogar eliminado, pero no se pudieron eliminar todas sus publicaciones asociadas."
          : "Hogar y publicacion asociada eliminados correctamente."
      );
    } catch {
      setMessage("No se pudo eliminar el hogar. Solo el administrador puede realizar esta acción.");
    }
  };

  const renderHogarCard = (hogar: Hogar, mode: "mine" | "pending" | "available") => {
    const isAdmin = isHogarAdmin(hogar, user?.id);
    const integrantes = hogar.integrantesIds || [];
    const solicitudes = hogar.solicitudesPendientesIds || [];

    return (
      <article className="module-item hogar-card" key={hogar.id}>
        <div className="section-heading-row">
          <div>
            <h4>{hogar.nombre}</h4>
            <p>{hogar.descripcion || "Sin descripción"}</p>
          </div>
          <span className={hogar.activo ? "status-pill success" : "status-pill"}>
            {hogar.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="hogar-meta-grid">
          <span><strong>{integrantes.length}</strong> integrante(s)</span>
          <span><strong>{solicitudes.length}</strong> solicitud(es)</span>
          <span><strong>{hogar.tareasIds?.length || 0}</strong> tarea(s)</span>
          <span><strong>{hogar.hogarCuentaIds?.length || 0}</strong> gasto(s)</span>
        </div>

        {mode === "mine" && (
          <>
            <div className="home-tags mt-3">
              {integrantes.map((usuarioId) => (
                <span className="home-tag" key={usuarioId}>
                  {formatMemberName(usuarioId, usuariosById, user || undefined)}
                  {usuarioId === hogar.usuarioAdministradorId ? " · Admin" : ""}
                </span>
              ))}
            </div>

            <div className="item-actions">
              <button className="btn btn-success btn-sm" onClick={() => navigate("/convivencia")}>Ver convivencia</button>
              {isAdmin && (
                <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarHogar(hogar)}>
                  Eliminar
                </button>
              )}
            </div>

            {isAdmin && solicitudes.length > 0 && (
              <div className="request-list">
                <h5>Solicitudes por revisar</h5>
                {solicitudes.map((usuarioId) => (
                  <div className="request-row" key={usuarioId}>
                    <span>{formatMemberName(usuarioId, usuariosById, user || undefined)}</span>
                    <div>
                      <button
                        className="btn btn-outline-success btn-sm"
                        disabled={Boolean(processingRequest)}
                        onClick={() => aprobarSolicitud(hogar.id, usuarioId)}
                      >
                        {processingRequest === `aprobar-${hogar.id}-${usuarioId}` ? "Aprobando..." : "Aprobar"}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={Boolean(processingRequest)}
                        onClick={() => rechazarSolicitud(hogar.id, usuarioId)}
                      >
                        {processingRequest === `rechazar-${hogar.id}-${usuarioId}` ? "Rechazando..." : "Rechazar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "pending" && (
          <div className="item-actions">
            <span className="status-pill">Solicitud enviada</span>
          </div>
        )}

        {mode === "available" && (
          <div className="item-actions">
            <button
              className="btn btn-outline-success btn-sm"
              disabled={Boolean(processingRequest)}
              onClick={() => solicitarIngreso(hogar.id)}
            >
              {processingRequest === `solicitar-${hogar.id}` ? "Enviando..." : "Solicitar ingreso"}
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
          {user?.role === "ADMIN" && (
            <button className="btn btn-outline-success" onClick={() => navigate("/dashboard")}>Admin</button>
          )}
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Mis hogares</h1>
        <p>Únete a un grupo roomie o crea uno si quieres administrar tu propio hogar compartido.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout hogares-layout">
        {canCreateHogar ? (
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Crear mi grupo roomie</h3>
            <p className="form-helper">
              Crea un hogar cuando quieras iniciar tu propio grupo de convivencia. Tú quedarás como administrador y podrás aceptar solicitudes.
            </p>
            <input className="form-control" placeholder="Nombre del hogar" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <textarea className="form-control" placeholder="Descripción del hogar" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Guardando..." : "Crear grupo roomie"}</button>
          </form>
        ) : (
          <aside className="module-form hogar-current-panel">
            <h3>Ya tienes un grupo roomie</h3>
            <p>
              Para organizar tareas, gastos, comprobantes y avisos, entra al panel de convivencia de tu hogar actual.
            </p>
            <button className="btn btn-success w-100" onClick={() => navigate("/convivencia")}>
              Ir a convivencia
            </button>
          </aside>
        )}

        <div className="module-list">
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando hogares...</p></div>
          ) : (
            <>
              <section className="hogares-section">
                <h3>Mi hogar actual</h3>
                {misHogares.length === 0 ? (
                  <div className="sin-resultados"><p>Aún no perteneces a un hogar.</p></div>
                ) : (
                  misHogares.map((hogar) => renderHogarCard(hogar, "mine"))
                )}
              </section>

              <section className="hogares-section">
                <h3>Solicitudes pendientes</h3>
                {solicitudesPendientes.length === 0 ? (
                  <p className="empty-state">No tienes solicitudes pendientes.</p>
                ) : (
                  solicitudesPendientes.map((hogar) => renderHogarCard(hogar, "pending"))
                )}
              </section>

              <section className="hogares-section">
                <h3>Hogares disponibles</h3>
                {hogaresDisponibles.length === 0 ? (
                  <p className="empty-state">No hay hogares disponibles para solicitar ingreso.</p>
                ) : (
                  hogaresDisponibles.map((hogar) => renderHogarCard(hogar, "available"))
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
