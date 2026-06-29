import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import { getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";
import {
  aceptarInvitacionHogar,
  aceptarSolicitudIngreso,
  rechazarInvitacionHogar,
  rechazarSolicitudIngreso,
} from "../utils/notificacionActions";

function isGenericTitle(titulo?: string) {
  return !titulo?.trim() || /^perfil de\s+/i.test(titulo);
}

function getPerfilTitle(perfil: Publicacion, usuario?: UsuarioResumen) {
  if (!isGenericTitle(perfil.titulo)) return perfil.titulo;
  return usuario?.nombre ? `${usuario.nombre} busca roomie` : `${perfil.nombre || "Usuario"} busca roomie`;
}

function getPerfilLocation(perfil: Publicacion) {
  const ubicacion = perfil.ubicacion?.trim();
  return ubicacion && ubicacion !== "Ubicacion no informada" ? ubicacion : "No informada por el usuario";
}

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function scorePerfil(usuario?: UsuarioResumen, currentUser?: { preferenciasCompatibilidad?: UsuarioResumen["preferenciasCompatibilidad"] }) {
  const preferencias = currentUser?.preferenciasCompatibilidad;
  const candidato = usuario?.preferenciasCompatibilidad;
  if (!preferencias || !candidato) return null;

  const campos: Array<keyof NonNullable<UsuarioResumen["preferenciasCompatibilidad"]>> = ["limpieza", "ambiente", "horario", "mascotas", "fumar"];
  const coincidencias = campos.filter((campo) => {
    if (campo === "presupuesto") return false;
    const valorUsuario = preferencias[campo] || "";
    const valorCandidato = candidato[campo] || "";
    return valorUsuario === valorCandidato || valorUsuario.startsWith("indiferente") || valorCandidato.startsWith("indiferente");
  }).length;

  const presupuestoUsuario = Number(preferencias.presupuesto || 0);
  const presupuestoCandidato = Number(candidato.presupuesto || 0);
  const presupuestoOk = !presupuestoUsuario || !presupuestoCandidato || Math.abs(presupuestoUsuario - presupuestoCandidato) <= 100000;

  return Math.round(((coincidencias + (presupuestoOk ? 1 : 0)) / 6) * 100);
}

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [perfilBackend, setPerfilBackend] = useState<Publicacion | null>(null);
  const [message, setMessage] = useState("");
  const [contextMessage, setContextMessage] = useState("");
  const [contextResolved, setContextResolved] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedHogarId, setSelectedHogarId] = useState("");
  const perfilLocal = getLocalPublicaciones()
    .find((publicacion) => publicacion.tipo === "busco_roomie" && String(publicacion.id) === id && !isGeneratedProfile(publicacion));

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), usuarioService.listar()])
      .then(([hogaresResult, usuariosResult]) => {
        if (hogaresResult.status === "fulfilled") setHogares(hogaresResult.value);
        if (usuariosResult.status === "fulfilled") setUsuarios(usuariosResult.value);
        if (hogaresResult.status === "rejected" || usuariosResult.status === "rejected") {
          setMessage("No se pudieron cargar todos los datos del perfil.");
        }
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    publicacionService
      .listar()
      .then((publicacionesData) => {
        if (!isMounted) return;
        setPublicaciones(publicacionesData);

        const encontrada = publicacionesData.find(
          (publicacion) => publicacion.tipo === "busco_roomie" && String(publicacion.id) === id,
        );

        setPerfilBackend(
          encontrada
            ? {
                ...encontrada,
                tipo: "busco_roomie",
                nombre: encontrada.nombre || encontrada.usuarioCreador,
                presupuestoMaximo: encontrada.presupuestoMaximo ?? encontrada.precio,
              }
            : null,
        );
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [id]);

  const notificationContext = useMemo(() => {
    const fromNotifications = searchParams.get("from") === "notificaciones";
    const tipoAccion = searchParams.get("tipoAccion");
    const hogarId = Number(searchParams.get("hogarId"));
    const usuarioId = Number(searchParams.get("usuarioId"));
    const notificacionId = Number(searchParams.get("notificacionId"));
    const publicacionId = Number(searchParams.get("publicacionId"));

    if (!fromNotifications || (tipoAccion !== "solicitud" && tipoAccion !== "invitacion") || !Number.isFinite(hogarId)) {
      return null;
    }

    const hogar = hogares.find((item) => item.id === hogarId);
    const publicacion = Number.isFinite(publicacionId)
      ? publicaciones.find((item) => item.id === publicacionId)
      : publicaciones.find((item) => hogar?.publicacionIds?.includes(item.id));

    return {
      tipoAccion,
      hogarId,
      usuarioId: Number.isFinite(usuarioId) ? usuarioId : Number(id),
      notificacionId: Number.isFinite(notificacionId) ? notificacionId : undefined,
      publicacionId: Number.isFinite(publicacionId) ? publicacionId : publicacion?.id,
      hogar,
      publicacion,
    };
  }, [hogares, id, publicaciones, searchParams]);

  const usuarioPerfil = useMemo(() => {
    const usuarioId = perfilLocal?.usuarioId || perfilBackend?.usuarioId;
    if (usuarioId) {
      return usuarios.find((item) => item.id === usuarioId);
    }

    const usuarioCreador = normalizeText(perfilBackend?.usuarioCreador || perfilLocal?.usuarioCreador);
    if (usuarioCreador) {
      return usuarios.find((item) => normalizeText(item.usuario) === usuarioCreador);
    }

    const idNumerico = Number(id);
    return Number.isFinite(idNumerico)
      ? usuarios.find((item) => item.id === idNumerico)
      : undefined;
  }, [id, perfilBackend?.usuarioCreador, perfilBackend?.usuarioId, perfilLocal?.usuarioCreador, perfilLocal?.usuarioId, usuarios]);

  const perfil = useMemo<Publicacion | null>(() => {
    if (perfilLocal) return perfilLocal;
    if (perfilBackend) return perfilBackend;
    if (!usuarioPerfil) return null;

    return {
      id: usuarioPerfil.id,
      tipo: "busco_roomie",
      usuarioId: usuarioPerfil.id,
      usuarioCreador: usuarioPerfil.usuario,
      nombre: usuarioPerfil.nombre || usuarioPerfil.usuario,
      titulo: `${usuarioPerfil.nombre || usuarioPerfil.usuario} busca roomie`,
      ubicacion: usuarioPerfil.hogarActual || "Ubicacion no informada",
      descripcion: usuarioPerfil.descripcion || "Usuario registrado con preferencias de convivencia.",
      presupuestoMaximo: Number(usuarioPerfil.preferenciasCompatibilidad?.presupuesto || 0),
      imagen: usuarioPerfil.fotoPerfil,
      telefono: usuarioPerfil.telefono,
      correo: usuarioPerfil.correo,
      intereses: usuarioPerfil.intereses,
      habitos: usuarioPerfil.preferenciasCompatibilidad
        ? [
            usuarioPerfil.preferenciasCompatibilidad.limpieza,
            usuarioPerfil.preferenciasCompatibilidad.ambiente,
            usuarioPerfil.preferenciasCompatibilidad.horario,
            usuarioPerfil.preferenciasCompatibilidad.mascotas,
            usuarioPerfil.preferenciasCompatibilidad.fumar,
          ]
        : [],
    };
  }, [perfilBackend, perfilLocal, usuarioPerfil]);

  const perfilUsuarioId = perfil?.usuarioId || usuarioPerfil?.id;

  const hogarDelPerfil = useMemo(() => {
    if (!perfilUsuarioId) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === perfilUsuarioId
      || hogar.usuarioAdministradorId === perfilUsuarioId
      || hogar.integrantesIds?.includes(perfilUsuarioId),
    ) || null;
  }, [hogares, perfilUsuarioId]);

  const miHogar = useMemo(() => {
    if (!user?.id) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === user.id
      || hogar.usuarioAdministradorId === user.id
      || hogar.integrantesIds?.includes(user.id),
    ) || null;
  }, [hogares, user?.id]);

  const miHogarAdministrable = useMemo(() => {
    if (!user?.id) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === user.id || hogar.usuarioAdministradorId === user.id,
    ) || null;
  }, [hogares, user?.id]);

  const misHogaresAdministrables = useMemo(() => {
    if (!user?.id) return [];
    return hogares.filter((hogar) => hogar.usuarioCreadorId === user.id || hogar.usuarioAdministradorId === user.id);
  }, [hogares, user?.id]);

  useEffect(() => {
    if (!selectedHogarId && misHogaresAdministrables.length === 1) {
      setSelectedHogarId(String(misHogaresAdministrables[0].id));
    }
  }, [misHogaresAdministrables, selectedHogarId]);

  const yaEstoyEnHogarPerfil = !!user?.id && !!hogarDelPerfil?.integrantesIds?.includes(user.id);
  const solicitudPendiente = !!user?.id && !!hogarDelPerfil?.solicitudesPendientesIds?.includes(user.id);
  const esMiPerfil = !!user?.id && perfilUsuarioId === user.id;
  const compatibilidadScore = scorePerfil(usuarioPerfil, user || undefined);
  const estadoPerfil = hogarDelPerfil
    ? "Pertenece a un hogar"
    : perfil?.tipo === "busco_roomie"
      ? "Busca casa"
      : "Perfil compatible";

  const solicitarIngreso = async () => {
    if (!user?.id || !hogarDelPerfil?.id) return;

    try {
      setIsSending(true);
      const actualizado = await hogarService.solicitarIngreso(hogarDelPerfil.id, { usuarioId: user.id });
      setHogares((current) => current.map((hogar) => hogar.id === actualizado.id ? actualizado : hogar));

      const usuarioReceptorId = hogarDelPerfil.usuarioAdministradorId || hogarDelPerfil.usuarioCreadorId;
      let avisosEnviados = true;

      try {
        await notificacionService.crear({
          usuarioEmisorId: user.id,
          usuarioReceptorId,
          hogarId: hogarDelPerfil.id,
          referenciaId: user.id,
          tipo: "INVITACION_HOGAR",
          estado: "PENDIENTE",
          titulo: "Solicitud de ingreso pendiente",
          mensaje: `${user.nombre || user.usuario} quiere unirse al grupo ${hogarDelPerfil.nombre}.`,
        });
      } catch {
        avisosEnviados = false;
      }

      try {
        const correo = await usuarioService.enviarCorreoSolicitudRecibida({
          usuarioReceptorId,
          usuarioSolicitanteId: user.id,
          solicitanteNombre: user.nombre || user.usuario,
          hogarNombre: hogarDelPerfil.nombre,
          publicacionTitulo: getPerfilTitle(perfil!, usuarioPerfil),
        });
        avisosEnviados = avisosEnviados && correo.enviado;
      } catch {
        avisosEnviados = false;
      }

      setMessage(avisosEnviados
        ? "Solicitud enviada correctamente. Se aviso al administrador del hogar."
        : "Solicitud enviada correctamente, pero no se pudo enviar alguno de los avisos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setIsSending(false);
    }
  };

  const invitarAMiGrupo = async () => {
    if (!user?.id || !perfilUsuarioId) return;
    const hogarInvitacion = misHogaresAdministrables.find((hogar) => String(hogar.id) === selectedHogarId) || miHogarAdministrable;
    if (!hogarInvitacion) return;

    try {
      setIsSending(true);
      await notificacionService.crear({
        usuarioEmisorId: user.id,
        usuarioReceptorId: perfilUsuarioId,
        hogarId: hogarInvitacion.id,
        referenciaId: hogarInvitacion.id,
        tipo: "INVITACION_HOGAR",
        estado: "PENDIENTE",
        titulo: "Invitacion a grupo roomie",
        mensaje: `${user.nombre || user.usuario} te invito a unirte al grupo ${hogarInvitacion.nombre}.`,
      });
      setMessage("Invitacion enviada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la invitacion.");
    } finally {
      setIsSending(false);
    }
  };

  const mostrarInteres = async () => {
    if (!user?.id || !perfilUsuarioId) return;

    try {
      setIsSending(true);
      await notificacionService.crear({
        usuarioEmisorId: user.id,
        usuarioReceptorId: perfilUsuarioId,
        hogarId: hogarDelPerfil?.id || miHogar?.id || 0,
        referenciaId: perfilUsuarioId,
        tipo: "INTERES_ROOMIE",
        estado: "PENDIENTE",
        titulo: "Nuevo interes de compatibilidad",
        mensaje: `${user.nombre || user.usuario} mostro interes en conectar contigo por compatibilidad.`,
      });
      setMessage("Interes registrado. Podras continuar el contacto cuando ambos usuarios confirmen interes.");
    } catch {
      setMessage("Interes registrado. Podras continuar el contacto cuando ambos usuarios confirmen interes.");
    } finally {
      setIsSending(false);
    }
  };

  const volver = () => {
    if (notificationContext) {
      navigate("/notificaciones");
      return;
    }
    navigate("/home");
  };

  const responderContexto = async (accion: "aceptar" | "rechazar") => {
    if (!user?.id || !notificationContext || contextResolved) return;

    try {
      setIsSending(true);
      if (notificationContext.tipoAccion === "solicitud") {
        if (accion === "aceptar") {
          const resultado = await aceptarSolicitudIngreso({
            hogarId: notificationContext.hogarId,
            solicitanteId: notificationContext.usuarioId,
            administradorId: user.id,
            notificacionId: notificationContext.notificacionId,
            hogarNombre: notificationContext.hogar?.nombre,
          });
          setContextMessage(resultado.message);
        } else {
          const resultado = await rechazarSolicitudIngreso({
            hogarId: notificationContext.hogarId,
            solicitanteId: notificationContext.usuarioId,
            administradorId: user.id,
            notificacionId: notificationContext.notificacionId,
            hogarNombre: notificationContext.hogar?.nombre,
          });
          setContextMessage(resultado.message);
        }
      } else if (accion === "aceptar") {
        const resultado = await aceptarInvitacionHogar({
          hogarId: notificationContext.hogarId,
          usuarioId: user.id,
          administradorId: notificationContext.hogar?.usuarioAdministradorId || notificationContext.usuarioId,
          notificacionId: notificationContext.notificacionId,
        });
        setContextMessage(resultado.message);
      } else {
        const resultado = await rechazarInvitacionHogar({ notificacionId: notificationContext.notificacionId });
        setContextMessage(resultado.message);
      }
      setContextResolved(true);
    } catch (error) {
      setContextMessage(error instanceof Error ? error.message : "No se pudo resolver esta notificacion.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={volver}>Volver</button>
          <LogoutButton />
        </div>
      </header>

      {message && <p className="api-message">{message}</p>}
      {contextMessage && <p className="api-message">{contextMessage}</p>}

      {!perfil ? (
        <div className="sin-resultados">
          <p>No se encontro el perfil de esta publicacion.</p>
        </div>
      ) : (
        <>
        {notificationContext && (
          <section className="notification-review-panel">
            <span className="eyebrow">Contexto de notificacion</span>
            <h2>{notificationContext.tipoAccion === "solicitud" ? "Solicitud de ingreso" : "Invitacion a hogar"}</h2>
            <p>
              {notificationContext.tipoAccion === "solicitud"
                ? "Esta persona solicito unirse a tu hogar/casa. Revisa su perfil antes de responder."
                : "Esta persona te invito a un hogar/casa. Revisa su perfil y la publicacion antes de responder."}
            </p>
            <div className="notification-context-grid">
              <span><strong>Hogar:</strong> {notificationContext.hogar?.nombre || `#${notificationContext.hogarId}`}</span>
              {notificationContext.publicacion && <span><strong>Casa:</strong> {notificationContext.publicacion.titulo || "Publicacion de casa"}</span>}
            </div>
            <div className="dashboard-actions mt-3">
              {notificationContext.publicacionId && (
                <button
                  className="btn btn-outline-success btn-sm"
                  type="button"
                  onClick={() => navigate(`/detalle-publicacion/${notificationContext.publicacionId}?${searchParams.toString()}`)}
                >
                  Ver publicacion de casa
                </button>
              )}
              <button className="btn btn-success btn-sm" disabled={isSending || contextResolved} onClick={() => responderContexto("aceptar")}>
                {notificationContext.tipoAccion === "solicitud" ? "Aceptar solicitud" : "Aceptar invitacion"}
              </button>
              <button className="btn btn-outline-danger btn-sm" disabled={isSending || contextResolved} onClick={() => responderContexto("rechazar")}>
                Rechazar
              </button>
              <button className="btn btn-outline-success btn-sm" type="button" onClick={() => navigate("/notificaciones")}>
                Volver a notificaciones
              </button>
            </div>
          </section>
        )}
        <main className="perfil-container perfil-publico-container">
          <section className="perfil-image">
            {perfil.imagen && <img src={perfil.imagen} alt={perfil.nombre || "Perfil roomie"} />}
            {!perfil.imagen && <div className="perfil-avatar-placeholder">{(perfil.nombre || "R").slice(0, 1).toUpperCase()}</div>}
          </section>

          <section className="perfil-info">
            <div className="perfil-publication-summary">
              <span className="demo-kicker">Perfil publico</span>
              <h1>{getPerfilTitle(perfil, usuarioPerfil)}</h1>
              <p className="perfil-ubicacion">Ubicacion: {getPerfilLocation(perfil)}</p>
              <p className="perfil-bio">{perfil.descripcion}</p>
              <div className="profile-status-row">
                <span className="status-pill success">{estadoPerfil}</span>
                {compatibilidadScore !== null && <span className="status-pill">{compatibilidadScore}% compatible contigo</span>}
              </div>
            </div>

            <div className="perfil-section">
              <h3>Publicado por</h3>
              <p><strong>{perfil.nombre}{perfil.edad ? `, ${perfil.edad}` : ""}</strong></p>
            </div>

            <div className="perfil-section">
              <h3>Busca hogar</h3>
              <p>
                Presupuesto maximo:{" "}
                <strong>${Number(perfil.presupuestoMaximo || perfil.precio || 0).toLocaleString("es-CL")} / mes</strong>
              </p>
            </div>

            <div className="perfil-section profile-action-panel">
              <h3>Acciones segun contexto</h3>
              <p className="form-helper">El contacto directo se mantiene privado hasta que exista solicitud, invitacion o interes confirmado.</p>
              {hogarDelPerfil ? (
                <p>Grupo actual: <strong>{hogarDelPerfil.nombre}</strong></p>
              ) : (
                <p>Este usuario aun no aparece asociado a un grupo hogar.</p>
              )}
              {misHogaresAdministrables.length > 1 && !hogarDelPerfil && !esMiPerfil && (
                <label className="field-label">
                  <span>Hogar para invitar</span>
                  <select className="form-control" value={selectedHogarId} onChange={(event) => setSelectedHogarId(event.target.value)}>
                    <option value="">Selecciona un hogar</option>
                    {misHogaresAdministrables.map((hogar) => (
                      <option key={hogar.id} value={hogar.id}>{hogar.nombre}</option>
                    ))}
                  </select>
                </label>
              )}
              {esMiPerfil ? (
                <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Ir a mi perfil</button>
              ) : yaEstoyEnHogarPerfil ? (
                <span className="status-pill">Ya perteneces a este grupo</span>
              ) : solicitudPendiente ? (
                <span className="status-pill">Solicitud enviada</span>
              ) : hogarDelPerfil ? (
                <button className="btn btn-success" disabled={isSending} onClick={solicitarIngreso}>
                  {isSending ? "Enviando..." : "Solicitar unirme a su grupo"}
                </button>
              ) : misHogaresAdministrables.length > 0 ? (
                <button className="btn btn-success" disabled={isSending || (misHogaresAdministrables.length > 1 && !selectedHogarId)} onClick={invitarAMiGrupo}>
                  {isSending ? "Enviando..." : "Invitar a mi grupo"}
                </button>
              ) : miHogar ? (
                <p>Tu grupo existe, pero solo el administrador puede invitar integrantes.</p>
              ) : (
                <button className="btn btn-outline-success" disabled={isSending} onClick={mostrarInteres}>
                  {isSending ? "Registrando..." : "Mostrar interes"}
                </button>
              )}
            </div>

            {!!perfil.intereses?.length && (
              <div className="perfil-section">
                <h3>Intereses y estilo</h3>
                <div className="perfil-tags">
                  {perfil.intereses.map((interes) => <span className="perfil-tag" key={interes}>{interes}</span>)}
                </div>
              </div>
            )}

            {!!perfil.habitos?.length && (
              <div className="perfil-section">
                <h3>Habitos de convivencia</h3>
                <div className="perfil-tags">
                  {perfil.habitos.map((habito) => (
                    <span className="perfil-tag secondary" key={habito}>{habito.replaceAll("_", " ")}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
        </>
      )}
    </div>
  );
}
