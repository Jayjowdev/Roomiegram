import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";
import type { Visita } from "../types/Visita";

function isHogarAdmin(hogar: Hogar, userId?: number) {
  return !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return hogar.integrantesIds?.includes(userId) || hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId;
}

function formatMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string }
) {
  if (usuarioId === currentUser?.id) {
    return currentUser.nombre || currentUser.usuario || "Tu";
  }
  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || "Usuario";
}

export default function SolicitudesHogar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState("");

  const loadData = () => {
    setIsLoading(true);

    if (!user?.id) {
      Promise.allSettled([hogarService.listar(), usuarioService.listar()])
        .then(([hogaresResult, usuariosResult]) => {
          setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
          setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

          if (hogaresResult.status === "rejected") {
            setMessage("Servicio no disponible. Intenta nuevamente.");
          } else {
            setMessage("");
          }
        })
        .finally(() => setIsLoading(false));
      return;
    }

    Promise.allSettled([
      hogarService.listar(),
      usuarioService.listar(),
      hogarService.listarMisVisitas(user.id),
    ])
      .then(([hogaresResult, usuariosResult, visitasResult]) => {
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);
        setVisitas(visitasResult.status === "fulfilled" ? visitasResult.value : []);

        if (hogaresResult.status === "rejected") {
          setMessage("Servicio no disponible. Intenta nuevamente.");
        } else {
          setMessage("");
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadData, [user?.id]);

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const misHogaresAdmin = useMemo(() => {
    return hogares.filter((hogar) => isHogarAdmin(hogar, user?.id));
  }, [hogares, user?.id]);

  const solicitudesRecibidas = useMemo(() => {
    return misHogaresAdmin
      .filter((hogar) => (hogar.solicitudesPendientesIds || []).length > 0)
      .map((hogar) => ({
        hogar,
        solicitudes: hogar.solicitudesPendientesIds || [],
      }));
  }, [misHogaresAdmin]);

  const solicitudesEnviadas = useMemo(() => {
    return hogares.filter((hogar) => (hogar.solicitudesPendientesIds || []).includes(user?.id || -1));
  }, [hogares, user?.id]);

  const hogaresDisponibles = useMemo(() => {
    return hogares.filter((hogar) => {
      return !userBelongsToHogar(hogar, user?.id) && !(hogar.solicitudesPendientesIds || []).includes(user?.id || -1);
    });
  }, [hogares, user?.id]);

  const visitasRealizadasPorHogar = useMemo(() => {
    const map = new Map<number, boolean>();
    visitas.forEach((visita) => {
      if (visita.estado === "REALIZADA" && visita.usuarioVisitanteId === user?.id) {
        map.set(visita.hogarId, true);
      }
    });
    return map;
  }, [visitas, user?.id]);

  const updateHogar = (hogarActualizado: Hogar) => {
    setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aprobar la solicitud.");
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo rechazar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  const solicitarIngreso = async (hogar: Hogar) => {
    if (!user?.id) {
      setMessage("Debes iniciar sesion para solicitar ingreso.");
      return;
    }

    if (!visitasRealizadasPorHogar.get(hogar.id)) {
      setMessage(`Debes agendar y completar una visita a "${hogar.nombre}" antes de enviar la solicitud.`);
      return;
    }

    const requestKey = `solicitar-${hogar.id}`;
    try {
      setProcessingRequest(requestKey);
      const actualizado = await hogarService.solicitarIngreso(hogar.id, { usuarioId: user.id });
      updateHogar(actualizado);
      setMessage("Solicitud enviada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/hogares")}>
            Mis hogares
          </button>
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Solicitudes de ingreso</h1>
        <p>Revisa las solicitudes recibidas en tus hogares, las que has enviado y los hogares disponibles.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <section className="module-list hogares-loading-panel">
          <div className="sin-resultados"><p>Cargando solicitudes...</p></div>
        </section>
      ) : (
        <section className="module-layout hogares-layout">
          <div className="module-list">
            <section className="hogares-section">
              <h3>Solicitudes recibidas</h3>
              {solicitudesRecibidas.length === 0 ? (
                <p className="empty-state">No tienes solicitudes de ingreso por revisar.</p>
              ) : (
                solicitudesRecibidas.map(({ hogar, solicitudes }) => (
                  <article className="module-item hogar-card hogar-card-mine" key={hogar.id}>
                    <div className="section-heading-row">
                      <div>
                        <h4>{hogar.nombre}</h4>
                        <p>{hogar.descripcion || "Sin descripcion"}</p>
                      </div>
                    </div>
                    <div className="request-list">
                      <h5>Solicitudes por revisar</h5>
                      {solicitudes.map((usuarioId) => (
                        <div className="request-row" key={usuarioId}>
                          <span>{formatMemberName(usuarioId, usuariosById, user || undefined)}</span>
                          <div>
                            <button
                              className="btn btn-outline-success btn-sm"
                              type="button"
                              disabled={Boolean(processingRequest)}
                              onClick={() => aprobarSolicitud(hogar.id, usuarioId)}
                            >
                              {processingRequest === `aprobar-${hogar.id}-${usuarioId}` ? "Aprobando..." : "Aprobar"}
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              disabled={Boolean(processingRequest)}
                              onClick={() => rechazarSolicitud(hogar.id, usuarioId)}
                            >
                              {processingRequest === `rechazar-${hogar.id}-${usuarioId}` ? "Rechazando..." : "Rechazar"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </section>

            <section className="hogares-section">
              <h3>Solicitudes enviadas</h3>
              {solicitudesEnviadas.length === 0 ? (
                <p className="empty-state">No has enviado solicitudes de ingreso.</p>
              ) : (
                solicitudesEnviadas.map((hogar) => (
                  <article className="module-item hogar-card" key={hogar.id}>
                    <div className="section-heading-row">
                      <div>
                        <h4>{hogar.nombre}</h4>
                        <p>{hogar.descripcion || "Sin descripcion"}</p>
                      </div>
                      <span className="status-pill">Solicitud enviada</span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>

          <div className="module-list hogares-secondary-panel">
            <section className="hogares-section hogares-section-secondary">
              <h3>Hogares disponibles</h3>
              <p className="form-helper">
                Recuerda que debes agendar y completar una visita antes de poder solicitar ingreso.
              </p>
              {hogaresDisponibles.length === 0 ? (
                <p className="empty-state">No hay hogares disponibles para solicitar ingreso.</p>
              ) : (
                hogaresDisponibles.map((hogar) => {
                  const visitaRealizada = visitasRealizadasPorHogar.get(hogar.id);
                  return (
                    <article className="module-item hogar-card" key={hogar.id}>
                      <div className="section-heading-row">
                        <div>
                          <h4>{hogar.nombre}</h4>
                          <p>{hogar.descripcion || "Sin descripcion"}</p>
                        </div>
                        {visitaRealizada ? (
                          <span className="status-pill success">Visita realizada</span>
                        ) : (
                          <span className="status-pill">Sin visita</span>
                        )}
                      </div>
                      <div className="item-actions">
                        {!visitaRealizada ? (
                          <button
                            className="btn btn-outline-success btn-sm"
                            type="button"
                            onClick={() => navigate(`/hogares/${hogar.id}/visitas`)}
                          >
                            Agendar visita
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline-success btn-sm"
                            type="button"
                            disabled={Boolean(processingRequest)}
                            onClick={() => solicitarIngreso(hogar)}
                          >
                            {processingRequest === `solicitar-${hogar.id}` ? "Enviando..." : "Solicitar ingreso"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
