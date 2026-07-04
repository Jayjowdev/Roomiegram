import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { resenaService } from "../services/resenaService";
import { usuarioService } from "../services/usuarioService";
import type { ResenaRoomie } from "../types/Backend";
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
import { getMascotasPreferenceFromValues, getMascotasPreferenceLabel, getMascotasPreferenceValue } from "../utils/preferenciasCompatibilidad";

function isGenericTitle(titulo?: string) {
  return !titulo?.trim() || /^perfil de\s+/i.test(titulo);
}

function getPerfilTitle(perfil: Publicacion, usuario?: UsuarioResumen) {
  if (!isGenericTitle(perfil.titulo)) return perfil.titulo;
  return usuario?.nombre ? `${usuario.nombre} busca roomie` : `${perfil.nombre || "Usuario"} busca roomie`;
}

function getPerfilLocation(perfil: Publicacion) {
  const ubicacion = perfil.ubicacion?.trim();
  return ubicacion && ubicacion !== "Ubicacion no informada" && ubicacion !== "Ubicación no informada" ? ubicacion : "No informada por el usuario";
}

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function getTelefonoContacto(telefono?: string) {
  const value = telefono?.trim();
  return value || "Teléfono no informado";
}

function getUsuarioNombre(usuarioId: number, usuariosById: Map<number, UsuarioResumen>, currentUser?: { id: number; nombre?: string; usuario?: string }) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tu";

  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || `Usuario #${usuarioId}`;
}

function getPublicacionCasaDelHogar(hogar: Hogar | null, publicaciones: Publicacion[]) {
  if (!hogar?.publicacionIds?.length) return undefined;
  return hogar.publicacionIds
    .map((publicacionId) => publicaciones.find((publicacion) => publicacion.id === publicacionId))
    .find((publicacion): publicacion is Publicacion => !!publicacion && publicacion.tipo !== "busco_roomie");
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
  const [isSavingResena, setIsSavingResena] = useState(false);
  const [selectedHogarId, setSelectedHogarId] = useState("");
  const [resenas, setResenas] = useState<ResenaRoomie[]>([]);
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentarioResena, setComentarioResena] = useState("");
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
      ubicacion: usuarioPerfil.hogarActual || "Ubicación no informada",
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
  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

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
  const publicacionCasaDelPerfil = useMemo(
    () => getPublicacionCasaDelHogar(hogarDelPerfil, publicaciones),
    [hogarDelPerfil, publicaciones],
  );
  const mascotasPreferencia = getMascotasPreferenceValue(usuarioPerfil?.preferenciasCompatibilidad?.mascotas)
    || getMascotasPreferenceFromValues(perfil?.habitos);

  useEffect(() => {
    if (!perfilUsuarioId) {
      setResenas([]);
      return;
    }

    let isMounted = true;
    resenaService
      .listarPorUsuario(perfilUsuarioId)
      .then((data) => {
        if (isMounted) setResenas(data);
      })
      .catch(() => {
        if (isMounted) setResenas([]);
      });

    return () => {
      isMounted = false;
    };
  }, [perfilUsuarioId]);

  const promedioResenas = useMemo(() => {
    if (!resenas.length) return 0;
    return resenas.reduce((total, resena) => total + Number(resena.puntuacion || 0), 0) / resenas.length;
  }, [resenas]);

  const enviarResena = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id || !perfilUsuarioId || !hogarDelPerfil?.id) return;

    if (!comentarioResena.trim()) {
      setMessage("Escribe un comentario para la reseña.");
      return;
    }

    try {
      setIsSavingResena(true);
      const creada = await resenaService.crear({
        usuarioEvaluadoId: perfilUsuarioId,
        usuarioAutorId: user.id,
        hogarId: hogarDelPerfil.id,
        puntuacion,
        comentario: comentarioResena.trim(),
      });
      setResenas((current) => [creada, ...current]);
      setComentarioResena("");
      setPuntuacion(5);
      setMessage("Reseña publicada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo publicar la reseña.");
    } finally {
      setIsSavingResena(false);
    }
  };

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
        ? "Solicitud enviada correctamente. Se avisó al administrador del hogar."
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
        titulo: "Invitación a grupo roomie",
        mensaje: `${user.nombre || user.usuario} te invitó a unirte al grupo ${hogarInvitacion.nombre}.`,
      });
      setMessage("Invitación enviada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la invitación.");
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
      setContextMessage(error instanceof Error ? error.message : "No se pudo resolver esta notificación.");
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
          <p>No se encontró el perfil de esta publicación.</p>
        </div>
      ) : (
        <>
        {notificationContext && (
          <section className="notification-review-panel">
            <span className="eyebrow">Contexto de notificación</span>
            <h2>{notificationContext.tipoAccion === "solicitud" ? "Solicitud de ingreso" : "Invitación a hogar"}</h2>
            <p>
              {notificationContext.tipoAccion === "solicitud"
                ? "Esta persona solicitó unirse a tu hogar/casa. Revisa su perfil antes de responder."
                : "Esta persona te invitó a un hogar/casa. Revisa su perfil y la publicación antes de responder."}
            </p>
            <div className="notification-context-grid">
              <span><strong>Hogar:</strong> {notificationContext.hogar?.nombre || `#${notificationContext.hogarId}`}</span>
              {notificationContext.publicacion && <span><strong>Casa:</strong> {notificationContext.publicacion.titulo || "Publicación de casa"}</span>}
            </div>
            <div className="dashboard-actions mt-3">
              {notificationContext.publicacionId && (
                <button
                  className="btn btn-outline-success btn-sm"
                  type="button"
                  onClick={() => navigate(`/detalle-publicacion/${notificationContext.publicacionId}?${searchParams.toString()}`)}
                >
                  Ver publicación de casa
                </button>
              )}
              <button className="btn btn-success btn-sm" disabled={isSending || contextResolved} onClick={() => responderContexto("aceptar")}>
                {notificationContext.tipoAccion === "solicitud" ? "Aceptar solicitud" : "Aceptar invitación"}
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
              <p className="perfil-ubicacion">Ubicación: {getPerfilLocation(perfil)}</p>
              <p className="perfil-bio">{perfil.descripcion}</p>
              <div className="profile-status-row">
                <span className="status-pill success">{estadoPerfil}</span>
                {compatibilidadScore !== null && <span className="status-pill">{compatibilidadScore}% compatible contigo</span>}
                <span className="status-pill">{resenas.length ? `${promedioResenas.toFixed(1)} / 5 · ${resenas.length} reseña(s)` : "Sin reseñas todavía"}</span>
              </div>
            </div>

            <div className="perfil-section">
              <h3>Publicado por</h3>
              <p><strong>{perfil.nombre}{perfil.edad ? `, ${perfil.edad}` : ""}</strong></p>
            </div>

            <div className="perfil-section">
              <h3>Busca hogar</h3>
              <p>
                Presupuesto máximo:{" "}
                <strong>${Number(perfil.presupuestoMaximo || perfil.precio || 0).toLocaleString("es-CL")} / mes</strong>
              </p>
            </div>

            {mascotasPreferencia && (
              <div className="perfil-section contact-info-panel">
                <h3>Preferencia de mascotas</h3>
                <span className={`pet-preference-badge pet-preference-inline pet-preference-${mascotasPreferencia}`}>
                  {getMascotasPreferenceLabel(mascotasPreferencia)}
                </span>
              </div>
            )}

            <div className="perfil-section contact-info-panel">
              <h3>Contacto</h3>
              <p className="whatsapp-note">Me puedes contactar por WhatsApp</p>
              <p><strong>Teléfono:</strong> {getTelefonoContacto(usuarioPerfil?.telefono || perfil.telefono)}</p>
            </div>

            <div className="perfil-section contact-info-panel">
              <h3>Reputación roomie</h3>
              <p>
                {resenas.length
                  ? `Promedio ${promedioResenas.toFixed(1)} de 5 basado en ${resenas.length} reseña(s).`
                  : "Este perfil aún no tiene reseñas de convivencia."}
              </p>
              {resenas.slice(0, 3).map((resena) => (
                <article className="compact-row" key={resena.id || `${resena.usuarioAutorId}-${resena.fechaCreacion}`}>
                  <div>
                    <strong>{"★".repeat(resena.puntuacion)}{"☆".repeat(5 - resena.puntuacion)}</strong>
                    <small>Por {getUsuarioNombre(resena.usuarioAutorId, usuariosById, user || undefined)}</small>
                    <span>{resena.comentario}</span>
                  </div>
                </article>
              ))}
            </div>

            {publicacionCasaDelPerfil && (
              <div className="perfil-section contact-info-panel">
                <h3>Hogar / publicación de casa</h3>
                <p>Esta persona pertenece a un hogar con una publicación disponible.</p>
                <button
                  className="btn btn-outline-success"
                  type="button"
                  onClick={() => navigate(`/detalle-publicacion/${publicacionCasaDelPerfil.id}`)}
                >
                  Ver publicación de casa
                </button>
              </div>
            )}

            <div className="perfil-section profile-action-panel">
              <h3>Acciones segun contexto</h3>
              <p className="form-helper">Elige una acción real según el contexto de esta persona.</p>
              {hogarDelPerfil ? (
                <p>Grupo actual: <strong>{hogarDelPerfil.nombre}</strong></p>
              ) : (
                <p>Este usuario aún no aparece asociado a un grupo hogar.</p>
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
                <p className="form-helper">Puedes revisar su teléfono y perfil para contactar directamente.</p>
              )}
            </div>

            {!esMiPerfil && hogarDelPerfil?.id && (
              <div className="perfil-section contact-info-panel">
                <h3>Dejar una reseña</h3>
                <p className="form-helper">Cuenta cómo fue coordinar o convivir con esta persona. Tu comentario ayuda a otros roomies a tomar mejores decisiones.</p>
                <form className="module-form mt-3" onSubmit={enviarResena}>
                  <select className="form-control" value={puntuacion} onChange={(event) => setPuntuacion(Number(event.target.value))}>
                    {[5, 4, 3, 2, 1].map((valor) => (
                      <option key={valor} value={valor}>{valor} estrella{valor === 1 ? "" : "s"}</option>
                    ))}
                  </select>
                  <textarea
                    className="form-control"
                    placeholder="Ejemplo: fue responsable con pagos, tareas y comunicación del hogar."
                    value={comentarioResena}
                    onChange={(event) => setComentarioResena(event.target.value)}
                    maxLength={500}
                  />
                  <button className="btn btn-success w-100" disabled={isSavingResena}>
                    {isSavingResena ? "Publicando..." : "Publicar reseña"}
                  </button>
                </form>
              </div>
            )}

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
                <h3>Hábitos de convivencia</h3>
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
