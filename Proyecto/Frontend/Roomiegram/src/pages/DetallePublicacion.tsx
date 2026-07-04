import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Publicacion } from "../types/Publicacion";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";
import { getLocalPublicaciones } from "../utils/localPublicaciones";
import {
  aceptarInvitacionHogar,
  aceptarSolicitudIngreso,
  rechazarInvitacionHogar,
  rechazarSolicitudIngreso,
} from "../utils/notificacionActions";
import { getMascotasPreferenceFromValues, getMascotasPreferenceLabel, getMascotasPreferenceValue } from "../utils/preferenciasCompatibilidad";
import { getPublicacionImage } from "../utils/publicacionImages";

const fallbackGallery = [home1, home2, home3];

function normalizarTexto(valor?: string) {
  return valor?.trim().toLowerCase() || "";
}

function getTelefonoContacto(telefono?: string) {
  const value = telefono?.trim();
  return value || "Teléfono no informado";
}

function buildGallery(images: Array<string | undefined>) {
  return [...new Set(images.filter((image): image is string => Boolean(image?.trim())))];
}

function mapBackendPublicacion(pub: Publicacion): Publicacion {
  const imagenGuardada = getPublicacionImage(pub.id);
  const imagen = pub.imagen || imagenGuardada || home1;
  const galeria = pub.galeria?.length ? buildGallery(pub.galeria) : buildGallery([imagen]);
  const tipo = pub.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa";

  return {
    id: pub.id,
    tipo,
    usuarioId: pub.usuarioId,
    usuarioCreador: pub.usuarioCreador,
    nombre: pub.usuarioCreador || "RoomieGram",
    titulo: pub.titulo || (tipo === "busco_roomie" ? "Usuario busca roomie" : "Habitación disponible"),
    precioMensual: tipo === "ofrezco_casa" ? (pub.precio || pub.precioMensual || 0) : undefined,
    presupuestoMaximo: tipo === "busco_roomie" ? (pub.presupuestoMaximo || pub.precio || 0) : undefined,
    precio: pub.precio || pub.precioMensual || 0,
    numeroHabitaciones: pub.numeroHabitaciones,
    numeroPersonas: pub.numeroPersonas,
    numeroBanos: pub.numeroBanos,
    ubicacion: pub.ubicacion,
    descripcion: pub.descripcion,
    habitos: pub.habitos,
    amenidades: tipo === "ofrezco_casa"
      ? [
          `${pub.numeroHabitaciones || 1} habitación(es)`,
          `${pub.numeroPersonas || 1} cupo(s)`,
          `${pub.numeroBanos || 1} baño(s)`,
        ]
      : undefined,
    imagen,
    galeria,
  };
}

export default function DetallePublicacion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [publicacion, setPublicacion] = useState<Publicacion | null>(
    getLocalPublicaciones().find((pub) => String(pub.id) === id) || null,
  );
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [message, setMessage] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contextMessage, setContextMessage] = useState("");
  const [contextResolved, setContextResolved] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedHogarId, setSelectedHogarId] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [processingRequest, setProcessingRequest] = useState("");

  useEffect(() => {
    publicacionService
      .listar()
      .then((data) => {
        const publicacionesMapeadas = data.map(mapBackendPublicacion);
        setPublicaciones(publicacionesMapeadas);
        const encontrada = publicacionesMapeadas.find((pub) => String(pub.id) === id);
        if (encontrada) {
          setPublicacion(encontrada);
          setSelectedImage(encontrada.imagen || encontrada.galeria?.[0] || "");
          setMessage("");
        }
      })
      .catch(() => {
        if (!publicacion) {
          setMessage("Servicio no disponible. Intenta nuevamente.");
        }
      });
  }, [id]);

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), usuarioService.listar()])
      .then(([hogaresResult, usuariosResult]) => {
        if (hogaresResult.status === "fulfilled") setHogares(hogaresResult.value);
        if (usuariosResult.status === "fulfilled") setUsuarios(usuariosResult.value);
      })
      .catch(() => undefined);
  }, []);

  const hogarVinculado = useMemo(() => {
    if (!publicacion?.id || publicacion.tipo === "busco_roomie") return null;
    return hogares.find((hogar) => hogar.publicacionIds?.includes(publicacion.id)) || null;
  }, [hogares, publicacion?.id, publicacion?.tipo]);

  const notificationContext = useMemo(() => {
    const fromNotifications = searchParams.get("from") === "notificaciones";
    const tipoAccion = searchParams.get("tipoAccion");
    const hogarId = Number(searchParams.get("hogarId"));
    const usuarioId = Number(searchParams.get("usuarioId"));
    const notificacionId = Number(searchParams.get("notificacionId"));

    if (!fromNotifications || (tipoAccion !== "solicitud" && tipoAccion !== "invitacion") || !Number.isFinite(hogarId)) {
      return null;
    }

    const hogar = hogares.find((item) => item.id === hogarId) || hogarVinculado || undefined;

    return {
      tipoAccion,
      hogarId,
      usuarioId: Number.isFinite(usuarioId) ? usuarioId : undefined,
      notificacionId: Number.isFinite(notificacionId) ? notificacionId : undefined,
      hogar,
    };
  }, [hogarVinculado, hogares, searchParams]);

  const esOfertaCasa = publicacion?.tipo !== "busco_roomie";

  const usuarioPublicacion = useMemo(() => {
    if (!publicacion) return undefined;
    if (publicacion.usuarioId) {
      return usuarios.find((usuario) => usuario.id === publicacion.usuarioId);
    }
    const creador = normalizarTexto(publicacion.usuarioCreador);
    return usuarios.find((usuario) => normalizarTexto(usuario.usuario) === creador);
  }, [publicacion, usuarios]);

  const hogarDelAutor = useMemo(() => {
    if (!usuarioPublicacion?.id) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === usuarioPublicacion.id
      || hogar.usuarioAdministradorId === usuarioPublicacion.id
      || hogar.integrantesIds?.includes(usuarioPublicacion.id),
    ) || null;
  }, [hogares, usuarioPublicacion?.id]);

  const publicacionCasaDelAutor = useMemo(() => {
    if (!hogarDelAutor?.publicacionIds?.length) return undefined;
    return hogarDelAutor.publicacionIds
      .map((publicacionId) => publicaciones.find((item) => item.id === publicacionId))
      .find((item): item is Publicacion => !!item && item.tipo !== "busco_roomie");
  }, [hogarDelAutor, publicaciones]);

  const telefonoContacto = publicacion?.telefono || usuarioPublicacion?.telefono;
  const mascotasPreferencia = getMascotasPreferenceFromValues(publicacion?.habitos)
    || getMascotasPreferenceValue(usuarioPublicacion?.preferenciasCompatibilidad?.mascotas);

  const misHogaresAdministrables = useMemo(() => {
    if (!user?.id) return [];
    return hogares.filter((hogar) => hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id);
  }, [hogares, user?.id]);

  useEffect(() => {
    if (!selectedHogarId && misHogaresAdministrables.length === 1) {
      setSelectedHogarId(String(misHogaresAdministrables[0].id));
    }
  }, [misHogaresAdministrables, selectedHogarId]);

  const esCreadorPublicacion = !!publicacion?.usuarioCreador
    && (
      publicacion.usuarioId === user?.id
      || normalizarTexto(publicacion.usuarioCreador) === normalizarTexto(user?.usuario)
      || normalizarTexto(publicacion.usuarioCreador) === normalizarTexto(user?.nombre)
    );

  const puedeAdministrarSolicitudes = esOfertaCasa && !!user?.id && !!hogarVinculado && (
    hogarVinculado.usuarioAdministradorId === user.id
    || hogarVinculado.usuarioCreadorId === user.id
    || esCreadorPublicacion
  );

  const solicitudYaEnviada = !!user?.id && !!hogarVinculado?.solicitudesPendientesIds?.includes(user.id);

  const getNombreUsuario = (usuarioId: number) => {
    const usuario = usuarios.find((item) => item.id === usuarioId);
    return usuario?.nombre || usuario?.usuario || `Usuario #${usuarioId}`;
  };

  const irACrearHogarParaPublicacion = () => {
    if (!publicacion?.id || !esOfertaCasa) return;
    const params = new URLSearchParams({
      publicacionId: String(publicacion.id),
      titulo: publicacion.titulo || "Publicación sin título",
      tipo: "ofrezco_casa",
    });
    navigate(`/hogares?${params.toString()}`);
  };

  const volver = () => {
    if (notificationContext) {
      navigate("/notificaciones");
      return;
    }
    navigate("/home");
  };

  const verPerfilPublico = () => {
    if (!publicacion) return;
    const usuarioPerfilId = publicacion.usuarioId || publicacion.id;
    navigate(`/perfil-publico/${usuarioPerfilId}`);
  };

  const invitarAMiHogar = async () => {
    if (!user?.id || !publicacion?.usuarioId) return;
    const hogar = misHogaresAdministrables.find((item) => String(item.id) === selectedHogarId);
    if (!hogar) {
      setContactMessage("Selecciona un hogar válido para enviar la invitación.");
      return;
    }

    try {
      setIsRequesting(true);
      await notificacionService.crear({
        usuarioEmisorId: user.id,
        usuarioReceptorId: publicacion.usuarioId,
        hogarId: hogar.id,
        referenciaId: hogar.id,
        tipo: "INVITACION_HOGAR",
        estado: "PENDIENTE",
        titulo: "Invitación a hogar Roomiegram",
        mensaje: `${user.nombre || user.usuario || "Un usuario"} te invitó a unirte al hogar ${hogar.nombre}.`,
      });
      setContactMessage(`Invitación enviada para el hogar ${hogar.nombre}.`);
    } catch {
      setContactMessage("No se pudo enviar la invitación. La publicación no fue modificada.");
    } finally {
      setIsRequesting(false);
    }
  };

  const responderContexto = async (accion: "aceptar" | "rechazar") => {
    if (!user?.id || !notificationContext || contextResolved) return;

    try {
      setIsRequesting(true);
      if (notificationContext.tipoAccion === "solicitud") {
        if (!notificationContext.usuarioId) throw new Error("No se pudo identificar al solicitante.");
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
          administradorId: notificationContext.hogar?.usuarioAdministradorId || notificationContext.usuarioId || user.id,
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
      setIsRequesting(false);
    }
  };

  const solicitarIngreso = async () => {
    if (!user?.id || !hogarVinculado?.id) {
      setContactMessage("No se pudo identificar el hogar para esta publicación.");
      return;
    }

    try {
      setIsRequesting(true);
      const actualizado = await hogarService.solicitarIngreso(hogarVinculado.id, { usuarioId: user.id });
      setHogares((current) => current.map((hogar) => (hogar.id === actualizado.id ? actualizado : hogar)));

      const usuarioReceptorId = hogarVinculado.usuarioAdministradorId || hogarVinculado.usuarioCreadorId;
      let avisosEnviados = true;

      if (usuarioReceptorId) {
        try {
          await notificacionService.crear({
            usuarioEmisorId: user.id,
            usuarioReceptorId,
            hogarId: hogarVinculado.id,
            referenciaId: user.id,
            tipo: "INVITACION_HOGAR",
            estado: "PENDIENTE",
            titulo: "Solicitud de ingreso pendiente",
            mensaje: `${user.nombre || user.usuario || "Un usuario"} está solicitando una revisión al hogar ${hogarVinculado.nombre}.`,
          });
        } catch {
          avisosEnviados = false;
        }

        try {
          const correo = await usuarioService.enviarCorreoSolicitudRecibida({
            usuarioReceptorId,
            usuarioSolicitanteId: user.id,
            solicitanteNombre: user.nombre || user.usuario,
            hogarNombre: hogarVinculado.nombre,
            publicacionTitulo: publicacion?.titulo,
          });
          avisosEnviados = avisosEnviados && correo.enviado;
        } catch {
          avisosEnviados = false;
        }
      }

      setContactMessage(avisosEnviados
        ? "Solicitud enviada correctamente. Se avisó al administrador del hogar."
        : "Solicitud enviada correctamente, pero no se pudo enviar alguno de los avisos.");
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setIsRequesting(false);
    }
  };

  const responderSolicitud = async (usuarioId: number, accion: "aprobar" | "rechazar") => {
    if (!user?.id || !hogarVinculado?.id) {
      setContactMessage("No se pudo identificar el hogar para gestionar la solicitud.");
      return;
    }

    try {
      setProcessingRequest(`${accion}-${usuarioId}`);
      const actualizado = accion === "aprobar"
        ? await hogarService.aprobarSolicitud(hogarVinculado.id, usuarioId, { administradorId: user.id })
        : await hogarService.rechazarSolicitud(hogarVinculado.id, usuarioId, { administradorId: user.id });

      setHogares((current) => current.map((hogar) => (hogar.id === actualizado.id ? actualizado : hogar)));
      let correoEnviado = true;
      try {
        const correo = await usuarioService.enviarCorreoSolicitudResuelta({
          usuarioSolicitanteId: usuarioId,
          administradorId: user.id,
          hogarNombre: hogarVinculado.nombre,
          aceptada: accion === "aprobar",
        });
        correoEnviado = correo.enviado;
      } catch {
        correoEnviado = false;
      }

      setContactMessage(correoEnviado
        ? accion === "aprobar"
          ? "Solicitud aprobada correctamente. Se avisó al solicitante por correo."
          : "Solicitud rechazada correctamente. Se avisó al solicitante por correo."
        : accion === "aprobar"
          ? "Solicitud aprobada correctamente, pero no se pudo enviar el correo al solicitante."
          : "Solicitud rechazada correctamente, pero no se pudo enviar el correo al solicitante.");
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : "No se pudo gestionar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  const galeria = publicacion?.galeria?.length
    ? buildGallery(publicacion.galeria)
    : publicacion?.imagen
      ? buildGallery([publicacion.imagen])
      : fallbackGallery;
  const mainImage = selectedImage || publicacion?.imagen || galeria[0];

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
      {contactMessage && <p className="api-message">{contactMessage}</p>}
      {contextMessage && <p className="api-message">{contextMessage}</p>}

      {!publicacion ? (
        <div className="sin-resultados"><p>No se encontró la publicación.</p></div>
      ) : (
        <>
        {notificationContext && (
          <section className="notification-review-panel">
            <span className="eyebrow">Contexto de notificación</span>
            <h2>
              {notificationContext.tipoAccion === "solicitud"
                ? "Solicitud relacionada con esta publicación"
                : "Invitación relacionada con esta casa"}
            </h2>
            <p>
              {notificationContext.tipoAccion === "solicitud"
                ? "Revisa la publicación y el perfil del solicitante antes de aceptar o rechazar."
                : "Revisa esta casa y el perfil del anfitrión antes de aceptar o rechazar."}
            </p>
            <div className="notification-context-grid">
              <span><strong>Hogar:</strong> {notificationContext.hogar?.nombre || `#${notificationContext.hogarId}`}</span>
              <span><strong>Publicación:</strong> {publicacion.titulo || "Casa disponible"}</span>
            </div>
            <div className="dashboard-actions mt-3">
              {notificationContext.usuarioId && (
                <button
                  className="btn btn-outline-success btn-sm"
                  type="button"
                  onClick={() => navigate(`/perfil-publico/${notificationContext.usuarioId}?${searchParams.toString()}`)}
                >
                {notificationContext.tipoAccion === "solicitud" ? "Ver perfil del solicitante" : "Ver perfil del anfitrión"}
                </button>
              )}
              <button className="btn btn-success btn-sm" disabled={isRequesting || contextResolved} onClick={() => responderContexto("aceptar")}>
                {notificationContext.tipoAccion === "solicitud" ? "Aceptar solicitud" : "Aceptar invitación"}
              </button>
              <button className="btn btn-outline-danger btn-sm" disabled={isRequesting || contextResolved} onClick={() => responderContexto("rechazar")}>
                Rechazar
              </button>
              <button className="btn btn-outline-success btn-sm" type="button" onClick={() => navigate("/notificaciones")}>
                Volver a notificaciones
              </button>
            </div>
          </section>
        )}
        <div className="detalle-publicacion">
          <section className="detalle-main">
            <div className="detalle-gallery">
              <img src={mainImage} alt={publicacion.titulo || "Casa"} className="detalle-gallery-main" />
              {galeria.length > 1 && (
                <div className="detalle-gallery-thumbs">
                  {galeria.map((imagen, index) => (
                    <button type="button" className="detalle-thumb-button" onClick={() => setSelectedImage(imagen)} key={`${imagen}-${index}`}>
                      <img src={imagen} alt={`Imagen ${index + 1} de ${publicacion.titulo}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="home-ubicacion">Ubicación: {publicacion.ubicacion}</p>
            <h1>{publicacion.titulo}</h1>
            <p className="home-precio">
              {esOfertaCasa
                ? `$${publicacion.precioMensual?.toLocaleString("es-CL")} / mes`
                : `Presupuesto: $${(publicacion.presupuestoMaximo || publicacion.precio || 0).toLocaleString("es-CL")}`}
            </p>
            <p className="detalle-desc">{publicacion.descripcion}</p>
            {esOfertaCasa && (
              <div className="detalle-info-grid">
                <span><strong>Habitaciones:</strong> {publicacion.numeroHabitaciones || 1}</span>
                <span><strong>Cupos:</strong> {publicacion.numeroPersonas || 1}</span>
                <span><strong>Baños:</strong> {publicacion.numeroBanos || 1}</span>
              </div>
            )}
            {publicacion.amenidades && (
              <div className="home-tags">
                {publicacion.amenidades.map((amenidad) => <span key={amenidad} className="home-tag amenidad-tag">{amenidad}</span>)}
              </div>
            )}
          </section>
          <aside className="detalle-side">
            <h3>Datos del anfitrión</h3>
            <p><strong>Nombre:</strong> {publicacion.nombre}</p>
            <p><strong>Tipo:</strong> {esOfertaCasa ? "Oferta de habitación/casa" : "Búsqueda de roomie"}</p>
            {mascotasPreferencia && (
              <div className="contact-info-panel compact-contact">
                <h4>Mascotas</h4>
                <span className={`pet-preference-badge pet-preference-inline pet-preference-${mascotasPreferencia}`}>
                  {getMascotasPreferenceLabel(mascotasPreferencia)}
                </span>
              </div>
            )}
            <div className="contact-info-panel compact-contact">
              <h4>Contacto</h4>
              <p className="whatsapp-note">Contacto por WhatsApp</p>
              <p><strong>Teléfono:</strong> {getTelefonoContacto(telefonoContacto)}</p>
            </div>
            {!esOfertaCasa ? (
              <div className="mt-3 profile-action-panel">
                <p>Esta publicación es de una persona buscando roomie. No es un hogar al que puedas solicitar ingreso.</p>
                {publicacionCasaDelAutor && (
                  <div className="contact-info-panel compact-contact">
                    <h4>Hogar / publicación de casa</h4>
                    <p>Esta persona pertenece a un hogar con una publicación disponible.</p>
                    <button
                      className="btn btn-outline-success w-100"
                      type="button"
                      onClick={() => navigate(`/detalle-publicacion/${publicacionCasaDelAutor.id}`)}
                    >
                      Ver publicación de casa
                    </button>
                  </div>
                )}
                {misHogaresAdministrables.length > 1 && (
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
                <div className="item-actions vertical-actions">
                  <button className="btn btn-outline-success w-100" type="button" onClick={verPerfilPublico}>
                    Ver perfil
                  </button>
                  {misHogaresAdministrables.length > 0 && publicacion.usuarioId !== user?.id && (
                    <button
                      className="btn btn-success w-100"
                      type="button"
                      disabled={isRequesting || (misHogaresAdministrables.length > 1 && !selectedHogarId)}
                      onClick={invitarAMiHogar}
                    >
                      {isRequesting ? "Enviando..." : "Invitar a mi hogar"}
                    </button>
                  )}
                  <button className="btn btn-outline-success w-100" type="button" onClick={() => navigate("/home?tipo=ofrezco_casa")}>
                    Buscar publicaciones de casa
                  </button>
                </div>
              </div>
            ) : puedeAdministrarSolicitudes ? (
              <div className="mt-3">
                <h4>Solicitudes del hogar</h4>
                {!hogarVinculado?.solicitudesPendientesIds?.length ? (
                  <p>No hay solicitudes pendientes por revisar.</p>
                ) : (
                  hogarVinculado.solicitudesPendientesIds.map((usuarioId) => (
                    <div className="request-row request-row-context" key={usuarioId}>
                      <span>
                        <strong>{getNombreUsuario(usuarioId)}</strong>
                        <small> quiere ingresar a {hogarVinculado.nombre}</small>
                      </span>
                      <div>
                        <button
                          className="btn btn-outline-success btn-sm"
                          type="button"
                          onClick={() => navigate(`/perfil-publico/${usuarioId}`)}
                        >
                          Ver perfil
                        </button>
                        <button
                          className="btn btn-outline-success btn-sm"
                          disabled={Boolean(processingRequest)}
                          onClick={() => responderSolicitud(usuarioId, "aprobar")}
                        >
                          {processingRequest === `aprobar-${usuarioId}` ? "Aprobando..." : "Aprobar"}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={Boolean(processingRequest)}
                          onClick={() => responderSolicitud(usuarioId, "rechazar")}
                        >
                          {processingRequest === `rechazar-${usuarioId}` ? "Rechazando..." : "Rechazar"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : hogarVinculado ? (
              solicitudYaEnviada ? (
                <span className="status-pill mt-3">Solicitud enviada</span>
              ) : (
                <button className="btn btn-success w-100 mt-3" disabled={isRequesting} onClick={solicitarIngreso}>
                  {isRequesting ? "Enviando solicitud..." : "Solicitar ingreso"}
                </button>
              )
            ) : (
              <div className="mt-3">
                <p className="mt-3">
                  Esta publicación no tiene un hogar vinculado para gestionar solicitudes.
                  {esCreadorPublicacion ? " Puedes crear un hogar para volver a gestionarla." : ""}
                </p>
                {esCreadorPublicacion && (
                  <>
                    <p className="form-helper">Puedes crear un hogar y vincularlo a esta publicación al guardarlo.</p>
                    <button className="btn btn-success w-100 mt-3" type="button" onClick={irACrearHogarParaPublicacion}>
                      Crear hogar para esta publicación
                    </button>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
        </>
      )}
    </div>
  );
}
