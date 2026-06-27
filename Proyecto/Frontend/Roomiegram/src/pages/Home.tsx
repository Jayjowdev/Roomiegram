import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { publicacionService, type Historia } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Publicacion } from "../types/Publicacion";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";
import { getPublicacionImage } from "../utils/publicacionImages";
import { COMUNAS_SANTIAGO } from "../utils/ubicaciones";

function normalizarTexto(valor?: string) {
  return valor
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") || "";
}

function getRoomieTitle(pub: Publicacion) {
  const titulo = pub.titulo?.trim() || "";
  if (titulo && !/^perfil de\s+/i.test(titulo)) return titulo;
  return `${pub.nombre || "Usuario"} busca roomie`;
}

function getLocation(pub: Publicacion) {
  const ubicacion = pub.ubicacion?.trim();
  return ubicacion && ubicacion !== "Ubicacion no informada" ? ubicacion : "Ubicacion no informada";
}

function mapBackendPublicacion(pub: Publicacion): Publicacion {
  const imagenGuardada = getPublicacionImage(pub.id);
  const imagen = pub.imagen || imagenGuardada || home1;
  const galeria = pub.galeria?.length ? pub.galeria : [imagen, home2, home3];
  const tipo = pub.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa";

  return {
    id: pub.id,
    tipo,
    origen: "backend",
    usuarioCreador: pub.usuarioCreador,
    nombre: pub.usuarioCreador || "RoomieGram",
    titulo: pub.titulo || (tipo === "busco_roomie" ? "Usuario busca roomie" : "Habitacion disponible"),
    precioMensual: tipo === "ofrezco_casa" ? (pub.precio || pub.precioMensual || 0) : undefined,
    presupuestoMaximo: tipo === "busco_roomie" ? (pub.precio || pub.presupuestoMaximo || 0) : undefined,
    precio: pub.precio || pub.precioMensual || 0,
    ubicacion: pub.ubicacion,
    descripcion: pub.descripcion,
    amenidades: tipo === "ofrezco_casa"
      ? [
          `${pub.numeroHabitaciones || 1} habitacion(es)`,
          `${pub.numeroPersonas || 1} cupo(s)`,
          `${pub.numeroBanos || 1} bano(s)`,
        ]
      : undefined,
    imagen,
    galeria,
  };
}

const beneficiosHome = [
  {
    titulo: "Compatibilidad",
    descripcion: "Encuentra personas con preferencias y estilos de vida afines.",
  },
  {
    titulo: "Publicaciones",
    descripcion: "Ofrece una habitacion o publica que estas buscando roomie.",
  },
  {
    titulo: "Tareas y gastos",
    descripcion: "Ordena responsabilidades y acuerdos del hogar compartido.",
  },
  {
    titulo: "Gestion de perfil",
    descripcion: "Administra tus preferencias y publicaciones desde tu cuenta.",
  },
];

const historiasFallback = [
  {
    id: -1,
    titulo: "Convivencia mas clara",
    nombreVisible: "Camila R.",
    mensaje: "Me ayudo a encontrar roomies con horarios parecidos y reglas claras desde el primer dia.",
  },
  {
    id: -2,
    titulo: "Publicacion simple",
    nombreVisible: "Diego M.",
    mensaje: "Publique una habitacion y pude revisar mejor a quienes estaban interesados antes de coordinar.",
  },
  {
    id: -3,
    titulo: "Hogar organizado",
    nombreVisible: "Valentina S.",
    mensaje: "La parte de tareas hizo mas facil organizar el departamento sin estar recordando todo por chat.",
  },
] satisfies Historia[];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtro, setFiltro] = useState<"busco_roomie" | "ofrezco_casa" | "todos">("todos");
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [ubicacionFiltro, setUbicacionFiltro] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [isLoadingHistorias, setIsLoadingHistorias] = useState(true);
  const [historiaForm, setHistoriaForm] = useState({
    titulo: "",
    mensaje: "",
  });
  const [historiaMessage, setHistoriaMessage] = useState("");
  const [isSavingHistoria, setIsSavingHistoria] = useState(false);
  const [contactForm, setContactForm] = useState({
    asunto: "",
    mensaje: "",
    correo: user?.correo || "",
  });
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const usuarioActual = normalizarTexto(user?.usuario);

  const loadPublicaciones = () => {
    let isMounted = true;
    setIsLoading(true);

    publicacionService
      .listar()
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map(mapBackendPublicacion);
        const locales = getLocalPublicaciones().filter((pub) => !isGeneratedProfile(pub));
        setPublicaciones([...locales, ...mapped]);
        setApiMessage("");
      })
      .catch(() => {
        if (isMounted) {
          setPublicaciones(getLocalPublicaciones().filter((pub) => !isGeneratedProfile(pub)));
          setApiMessage("Servicio no disponible. Intenta nuevamente.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    return loadPublicaciones();
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingHistorias(true);

    publicacionService
      .listarHistorias()
      .then((data) => {
        if (!isMounted) return;
        setHistorias(data);
      })
      .catch(() => {
        if (isMounted) setHistorias([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistorias(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user?.correo) {
      setContactForm((current) => ({ ...current, correo: current.correo || user.correo || "" }));
    }
  }, [user?.correo]);

  const puedeEliminarPublicacion = (pub: Publicacion) => {
    const creador = normalizarTexto(pub.usuarioCreador);
    return !!usuarioActual && !!creador && creador === usuarioActual;
  };

  const handleDelete = async (pub: Publicacion) => {
    setApiMessage("");
    if (!user?.usuario) {
      setApiMessage("No se pudo identificar el usuario autenticado.");
      return;
    }

    try {
      if (pub.origen === "backend") {
        await publicacionService.eliminar(pub.id, user.usuario, user?.role || "CLIENTE");
      }

      setPublicaciones((current) => current.filter((currentPub) => currentPub.id !== pub.id));
      deleteLocalPublicacion(pub.id);
      setApiMessage("Publicacion eliminada correctamente.");
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "No se pudo eliminar en el servicio.");
    }
  };

  const publicacionesFiltradas = useMemo(() => {
    const ubicacionNormalizada = normalizarTexto(ubicacionFiltro);

    return publicaciones.filter((pub) => {
      const coincideTipo = filtro === "todos" || pub.tipo === filtro;
      const coincideUbicacion = !ubicacionNormalizada || normalizarTexto(pub.ubicacion).includes(ubicacionNormalizada);
      return coincideTipo && coincideUbicacion;
    });
  }, [filtro, publicaciones, ubicacionFiltro]);

  const tieneFiltrosActivos = filtro !== "todos" || ubicacionFiltro.trim().length > 0;
  const historiasVisibles = historias.length > 0 ? historias.slice(0, 6) : historiasFallback;

  const limpiarFiltros = () => {
    setFiltro("todos");
    setUbicacionFiltro("");
  };

  const buscarRoomie = () => {
    setFiltro("busco_roomie");
    document.getElementById("home-publicaciones")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHistoriaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const titulo = historiaForm.titulo.trim();
    const mensaje = historiaForm.mensaje.trim();

    if (!titulo) {
      setHistoriaMessage("Ingresa un titulo breve para tu historia.");
      return;
    }
    if (!mensaje) {
      setHistoriaMessage("Escribe tu historia antes de publicarla.");
      return;
    }
    if (mensaje.length < 20) {
      setHistoriaMessage("La historia debe tener al menos 20 caracteres.");
      return;
    }
    if (mensaje.length > 500) {
      setHistoriaMessage("La historia no puede superar 500 caracteres.");
      return;
    }

    try {
      setIsSavingHistoria(true);
      const historia = await publicacionService.crearHistoria({
        titulo,
        mensaje,
        nombreVisible: user?.nombre || user?.usuario || "Usuario Roomiegram",
        usuarioCreador: user?.usuario,
      });
      setHistorias((current) => [historia, ...current]);
      setHistoriaForm({ titulo: "", mensaje: "" });
      setHistoriaMessage("Historia publicada correctamente.");
    } catch (error) {
      setHistoriaMessage(error instanceof Error ? error.message : "No se pudo publicar la historia.");
    } finally {
      setIsSavingHistoria(false);
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const asunto = contactForm.asunto.trim();
    const mensaje = contactForm.mensaje.trim();
    const correo = contactForm.correo.trim();

    if (!asunto) {
      setContactMessage("Ingresa un asunto para el mensaje.");
      return;
    }
    if (!mensaje) {
      setContactMessage("Escribe tu mensaje para soporte.");
      return;
    }
    if (mensaje.length < 20) {
      setContactMessage("El mensaje debe tener al menos 20 caracteres.");
      return;
    }
    if (!correo || !correo.includes("@")) {
      setContactMessage("Ingresa un correo de contacto valido.");
      return;
    }

    try {
      setIsSendingContact(true);
      const response = await usuarioService.enviarContactoSoporte({
        asunto,
        mensaje,
        correo,
        nombre: user?.nombre,
        usuario: user?.usuario,
      });

      setContactMessage(response.mensaje || "Mensaje enviado al equipo de soporte.");
      if (response.enviado) {
        setContactForm({ asunto: "", mensaje: "", correo: user?.correo || correo });
      }
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : "No se pudo enviar el mensaje de soporte.");
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/home")} />
        <div className="home-header-actions">
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/planes")}>Planes</button>
          <NotificationBell className="me-2" />
          {/* <button className="btn btn-outline-success me-2" onClick={() => navigate("/compatibilidad")}>Buscar compatibilidad</button> */}
          {user?.role === "ADMIN" && (
            <button className="btn btn-success" onClick={() => navigate("/dashboard")}>Admin</button>
          )}
          <LogoutButton />
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Conecta con tu roomie ideal</h1>
          <p>Encuentra roomies compatibles, publica un espacio o gestiona tus publicaciones desde un solo lugar.</p>
          <div className="home-hero-actions">
            <button className="btn btn-success" type="button" onClick={buscarRoomie}>
              Buscar roomie
            </button>
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/crear-publicacion")}>
              Crear publicacion
            </button>
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/mis-publicaciones")}>
              Mis publicaciones
            </button>
          </div>
        </div>
      </section>

      <section className="home-section home-listing-intro" aria-labelledby="home-listing-title">
        <div className="home-section-heading">
          <span>Publicaciones disponibles</span>
          <h2 id="home-listing-title">Explora habitaciones y roomies</h2>
        </div>
      </section>

      <section className="home-filtros">
        <div className="home-filter-panel">
          <div className="filtros-container">
            <button className={`btn filtro-btn ${filtro === "todos" ? "filtro-activo" : ""}`} onClick={() => setFiltro("todos")}>Ver todos</button>
            <button className={`btn filtro-btn ${filtro === "busco_roomie" ? "filtro-activo" : ""}`} onClick={() => setFiltro("busco_roomie")}>Buscar roomie</button>
            <button className={`btn filtro-btn ${filtro === "ofrezco_casa" ? "filtro-activo" : ""}`} onClick={() => setFiltro("ofrezco_casa")}>Ofertar casa</button>
          </div>
          <div className="home-location-filter">
            <input
              className="form-control"
              placeholder="Filtrar por ubicacion"
              list="home-comunas-santiago"
              value={ubicacionFiltro}
              onChange={(event) => setUbicacionFiltro(event.target.value)}
            />
            <datalist id="home-comunas-santiago">
              {COMUNAS_SANTIAGO.map((comuna) => (
                <option key={comuna} value={comuna} />
              ))}
            </datalist>
            <button className="btn btn-outline-success" type="button" onClick={limpiarFiltros} disabled={!tieneFiltrosActivos}>
              Limpiar
            </button>
          </div>
          <p className="home-results-count">
            {isLoading ? "Cargando publicaciones..." : `${publicacionesFiltradas.length} de ${publicaciones.length} publicaciones`}
          </p>
        </div>
      </section>

      {apiMessage && <p className="api-message">{apiMessage}</p>}

      <section className="home-publicaciones" id="home-publicaciones">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando publicaciones...</p></div>
        ) : publicacionesFiltradas.length === 0 ? (
          <div className="sin-resultados"><p>{tieneFiltrosActivos ? "No hay publicaciones para esos filtros." : "No hay publicaciones disponibles"}</p></div>
        ) : (
          publicacionesFiltradas.map((pub) => (
            <article className="home-card" key={`${pub.origen || "publicacion"}-${pub.tipo || "publicacion"}-${pub.id}`}>
              {pub.tipo === "busco_roomie" ? (
                <>
                  {pub.imagen && <img src={pub.imagen} alt={pub.nombre} className="home-card-img" />}
                  <div className="home-card-body">
                    <div className="home-card-top">
                      <h3>{getRoomieTitle(pub)}</h3>
                      <p className="home-desc-oferta"><strong>Publicado por:</strong> {pub.nombre}{pub.edad ? ` (${pub.edad} anos)` : ""}</p>
                      <p className="home-ubicacion">Ubicacion: {getLocation(pub)}</p>
                    </div>
                    <p className="home-desc">{pub.descripcion}</p>
                    {pub.intereses && <div className="home-tags">{pub.intereses.map((tag) => <span key={tag} className="home-tag">{tag}</span>)}</div>}
                    <button className="btn btn-success w-100 mt-4" onClick={() => navigate(`/perfil/${pub.id}`)}>Ver perfil</button>
                    {puedeEliminarPublicacion(pub) && <button className="btn btn-outline-danger w-100 mt-2" onClick={() => handleDelete(pub)}>Eliminar</button>}
                  </div>
                </>
              ) : (
                <>
                  {pub.imagen && <img src={pub.imagen} alt={pub.titulo || pub.ubicacion} className="home-card-img" />}
                  <div className="home-card-body">
                    <div className="home-card-top">
                      <h3>{pub.titulo}</h3>
                      <p className="home-ubicacion">Ubicacion: {pub.ubicacion}</p>
                      <p className="home-precio">${pub.precioMensual?.toLocaleString("es-CL")} / mes</p>
                    </div>
                    <p className="home-desc-oferta"><strong>Ofrecido por:</strong> {pub.nombre}{pub.edad ? ` (${pub.edad} anos)` : ""}</p>
                    <p className="home-desc">{pub.descripcion}</p>
                    {pub.amenidades && <div className="home-tags">{pub.amenidades.map((amenidad) => <span key={amenidad} className="home-tag amenidad-tag">{amenidad}</span>)}</div>}
                    <button className="btn btn-outline-success w-100 mt-4" onClick={() => navigate(`/detalle-publicacion/${pub.id}`)}>Ver detalles</button>
                    {puedeEliminarPublicacion(pub) && <button className="btn btn-outline-danger w-100 mt-2" onClick={() => handleDelete(pub)}>Eliminar</button>}
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </section>

      <section className="home-section home-benefits-section" aria-labelledby="home-benefits-title">
        <div className="home-section-heading home-section-heading-compact">
          <span>Herramientas</span>
          <h2 id="home-benefits-title">Lo esencial para convivir mejor</h2>
        </div>
        <div className="home-benefits-grid">
          {beneficiosHome.map((beneficio) => (
            <article className="home-info-card" key={beneficio.titulo}>
              <h3>{beneficio.titulo}</h3>
              <p>{beneficio.descripcion}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-testimonials-section" aria-labelledby="home-testimonials-title">
        <div className="home-section-heading">
          <span>Historias de usuarios</span>
          <h2 id="home-testimonials-title">Comparte y revisa experiencias de convivencia</h2>
        </div>
        <div className="home-stories-layout">
          <div className="home-testimonials-grid">
            {isLoadingHistorias ? (
              <article className="home-testimonial-card">
                <p>Cargando historias...</p>
                <strong>Roomiegram</strong>
              </article>
            ) : (
              historiasVisibles.map((historia) => (
                <article className="home-testimonial-card" key={historia.id}>
                  <h3>{historia.titulo}</h3>
                  <p>"{historia.mensaje}"</p>
                  <strong>{historia.nombreVisible}</strong>
                </article>
              ))
            )}
          </div>

          <form className="home-inline-form" onSubmit={handleHistoriaSubmit}>
            <h3>Deja tu historia</h3>
            <input
              className="form-control"
              placeholder="Titulo breve"
              maxLength={80}
              value={historiaForm.titulo}
              onChange={(event) => setHistoriaForm((current) => ({ ...current, titulo: event.target.value }))}
            />
            <textarea
              className="form-control"
              placeholder="Cuenta brevemente como te ayudo Roomiegram"
              maxLength={500}
              rows={4}
              value={historiaForm.mensaje}
              onChange={(event) => setHistoriaForm((current) => ({ ...current, mensaje: event.target.value }))}
            />
            <small>{historiaForm.mensaje.length}/500 caracteres</small>
            {historiaMessage && <p className="form-feedback">{historiaMessage}</p>}
            <button className="btn btn-success" type="submit" disabled={isSavingHistoria}>
              {isSavingHistoria ? "Publicando..." : "Publicar historia"}
            </button>
          </form>
        </div>
      </section>

      <section className="home-contact-section" aria-labelledby="home-contact-title">
        <div>
          <span>Soporte</span>
          <h2 id="home-contact-title">Tienes dudas o necesitas ayuda?</h2>
          <p>Escribenos para recibir orientacion sobre tu cuenta, publicaciones o convivencia.</p>
        </div>
        <form className="home-contact-form" onSubmit={handleContactSubmit}>
          <input
            className="form-control"
            placeholder="Asunto"
            maxLength={100}
            value={contactForm.asunto}
            onChange={(event) => setContactForm((current) => ({ ...current, asunto: event.target.value }))}
          />
          <input
            className="form-control"
            placeholder="Correo de contacto"
            type="email"
            value={contactForm.correo}
            onChange={(event) => setContactForm((current) => ({ ...current, correo: event.target.value }))}
          />
          <textarea
            className="form-control"
            placeholder="Mensaje para soporte"
            maxLength={1000}
            rows={3}
            value={contactForm.mensaje}
            onChange={(event) => setContactForm((current) => ({ ...current, mensaje: event.target.value }))}
          />
          {contactMessage && <p className="form-feedback">{contactMessage}</p>}
          <button className="btn btn-success" type="submit" disabled={isSendingContact}>
            {isSendingContact ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      </section>
    </div>
  );
}
