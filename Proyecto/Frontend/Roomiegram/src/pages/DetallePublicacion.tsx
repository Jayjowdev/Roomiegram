import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getLocalPublicaciones } from "../utils/localPublicaciones";
import { getPublicacionImage } from "../utils/publicacionImages";

const fallbackGallery = [home1, home2, home3];

function normalizarTexto(valor?: string) {
  return valor?.trim().toLowerCase() || "";
}

function buildGallery(images: Array<string | undefined>) {
  return [...new Set(images.filter((image): image is string => Boolean(image?.trim())))];
}

function mapBackendPublicacion(pub: Publicacion): Publicacion {
  const imagenGuardada = getPublicacionImage(pub.id);
  const imagen = pub.imagen || imagenGuardada || home1;
  const galeria = pub.galeria?.length ? buildGallery(pub.galeria) : buildGallery([imagen]);

  return {
    id: pub.id,
    tipo: "ofrezco_casa",
    usuarioId: pub.usuarioId,
    usuarioCreador: pub.usuarioCreador,
    nombre: pub.usuarioCreador || "RoomieGram",
    titulo: pub.titulo || "Habitacion disponible",
    precioMensual: pub.precio || pub.precioMensual || 0,
    precio: pub.precio || pub.precioMensual || 0,
    numeroHabitaciones: pub.numeroHabitaciones,
    numeroPersonas: pub.numeroPersonas,
    numeroBanos: pub.numeroBanos,
    ubicacion: pub.ubicacion,
    descripcion: pub.descripcion,
    amenidades: [
      `${pub.numeroHabitaciones || 1} habitacion(es)`,
      `${pub.numeroPersonas || 1} cupo(s)`,
      `${pub.numeroBanos || 1} bano(s)`,
    ],
    imagen,
    galeria,
  };
}

export default function DetallePublicacion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [publicacion, setPublicacion] = useState<Publicacion | null>(
    getLocalPublicaciones().find((pub) => pub.tipo === "ofrezco_casa" && String(pub.id) === id) || null,
  );
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [message, setMessage] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [processingRequest, setProcessingRequest] = useState("");

  useEffect(() => {
    publicacionService
      .listar()
      .then((data) => {
        const encontrada = data.map(mapBackendPublicacion).find((pub) => String(pub.id) === id);
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
    hogarService
      .listar()
      .then((data) => setHogares(data))
      .catch(() => undefined);
  }, []);

  const hogarVinculado = useMemo(() => {
    if (!publicacion?.id) return null;
    return hogares.find((hogar) => hogar.publicacionIds?.includes(publicacion.id)) || null;
  }, [hogares, publicacion?.id]);

  const esCreadorPublicacion = !!publicacion?.usuarioCreador
    && (
      publicacion.usuarioId === user?.id
      || normalizarTexto(publicacion.usuarioCreador) === normalizarTexto(user?.usuario)
      || normalizarTexto(publicacion.usuarioCreador) === normalizarTexto(user?.nombre)
    );

  const puedeAdministrarSolicitudes = !!user?.id && !!hogarVinculado && (
    hogarVinculado.usuarioAdministradorId === user.id
    || hogarVinculado.usuarioCreadorId === user.id
    || esCreadorPublicacion
  );

  const solicitudYaEnviada = !!user?.id && !!hogarVinculado?.solicitudesPendientesIds?.includes(user.id);

  const irACrearHogarParaPublicacion = () => {
    if (!publicacion?.id) return;
    const params = new URLSearchParams({
      publicacionId: String(publicacion.id),
      titulo: publicacion.titulo || "Publicacion sin titulo",
      tipo: publicacion.tipo || "ofrezco_casa",
    });
    navigate(`/hogares?${params.toString()}`);
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
            mensaje: `${user.nombre || user.usuario || "Un usuario"} esta solicitando una revision al hogar ${hogarVinculado.nombre}.`,
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
        ? "Solicitud enviada correctamente. Se aviso al administrador del hogar."
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
          ? "Solicitud aprobada correctamente. Se aviso al solicitante por correo."
          : "Solicitud rechazada correctamente. Se aviso al solicitante por correo."
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
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver</button>
          <LogoutButton />
        </div>
      </header>

      {message && <p className="api-message">{message}</p>}
      {contactMessage && <p className="api-message">{contactMessage}</p>}

      {!publicacion ? (
        <div className="sin-resultados"><p>No se encontro la publicacion.</p></div>
      ) : (
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
            <p className="home-ubicacion">Ubicacion: {publicacion.ubicacion}</p>
            <h1>{publicacion.titulo}</h1>
            <p className="home-precio">${publicacion.precioMensual?.toLocaleString("es-CL")} / mes</p>
            <p className="detalle-desc">{publicacion.descripcion}</p>
            <div className="detalle-info-grid">
              <span><strong>Habitaciones:</strong> {publicacion.numeroHabitaciones || 1}</span>
              <span><strong>Cupos:</strong> {publicacion.numeroPersonas || 1}</span>
              <span><strong>Banos:</strong> {publicacion.numeroBanos || 1}</span>
            </div>
            {publicacion.amenidades && (
              <div className="home-tags">
                {publicacion.amenidades.map((amenidad) => <span key={amenidad} className="home-tag amenidad-tag">{amenidad}</span>)}
              </div>
            )}
          </section>
          <aside className="detalle-side">
            <h3>Datos del anfitrion</h3>
            <p><strong>Nombre:</strong> {publicacion.nombre}</p>
            <p><strong>Tipo:</strong> Oferta de habitacion/casa</p>
            {puedeAdministrarSolicitudes ? (
              <div className="mt-3">
                <h4>Solicitudes del hogar</h4>
                {!hogarVinculado?.solicitudesPendientesIds?.length ? (
                  <p>No hay solicitudes pendientes por revisar.</p>
                ) : (
                  hogarVinculado.solicitudesPendientesIds.map((usuarioId) => (
                    <div className="request-row" key={usuarioId}>
                      <span>Solicitud de integrante</span>
                      <div>
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
              <p className="mt-3">Esta publicación no tiene un hogar vinculado para gestionar solicitudes.</p>
                {esCreadorPublicacion && (
                  <>
                    <p className="form-helper">Puedes crear un hogar y vincularlo a esta publicacion al guardarlo.</p>
                    <button className="btn btn-success w-100 mt-3" type="button" onClick={irACrearHogarParaPublicacion}>
                      Crear hogar para esta publicacion
                    </button>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
