import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { publicacionService } from "../services/publicacionService";
import type { Publicacion } from "../types/Publicacion";
import { deleteLocalPublicacion, getLocalPublicaciones } from "../utils/localPublicaciones";
import { getPublicacionImage } from "../utils/publicacionImages";

function normalizarTexto(valor?: string) {
  return valor?.trim().toLowerCase() || "";
}

function mapBackendPublicacion(pub: Publicacion): Publicacion {
  const imagenGuardada = getPublicacionImage(pub.id);
  const imagen = pub.imagen || imagenGuardada || home1;
  const galeria = pub.galeria?.length ? pub.galeria : [imagen, home2, home3];

  return {
    id: pub.id,
    tipo: "ofrezco_casa",
    origen: "backend",
    usuarioCreador: pub.usuarioCreador,
    nombre: pub.usuarioCreador || "RoomieGram",
    titulo: pub.titulo || "Habitacion disponible",
    precioMensual: pub.precio || pub.precioMensual || 0,
    precio: pub.precio || pub.precioMensual || 0,
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

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtro, setFiltro] = useState<"busco_roomie" | "ofrezco_casa" | "todos">("todos");
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");
  const usuarioActual = normalizarTexto(user?.usuario);

  const loadPublicaciones = () => {
    let isMounted = true;
    setIsLoading(true);

    publicacionService
      .listar()
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map(mapBackendPublicacion);
        const locales = getLocalPublicaciones();
        setPublicaciones([...locales, ...mapped]);
        setApiMessage("");
      })
      .catch(() => {
        if (isMounted) {
          setPublicaciones(getLocalPublicaciones());
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
    return filtro === "todos" ? publicaciones : publicaciones.filter((pub) => pub.tipo === filtro);
  }, [filtro, publicaciones]);

  return (
    <div className="home-page">
      <header className="home-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/")} />
        <div className="home-header-actions">
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
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
          <p>Busca personas que compartan tu espacio u ofrece tu casa o habitacion.</p>
        </div>
      </section>

      <section className="home-filtros">
        <div className="filtros-container">
          <button className={`btn filtro-btn ${filtro === "todos" ? "filtro-activo" : ""}`} onClick={() => setFiltro("todos")}>Ver todos</button>
          <button className={`btn filtro-btn ${filtro === "busco_roomie" ? "filtro-activo" : ""}`} onClick={() => setFiltro("busco_roomie")}>Buscar roomie</button>
          <button className={`btn filtro-btn ${filtro === "ofrezco_casa" ? "filtro-activo" : ""}`} onClick={() => setFiltro("ofrezco_casa")}>Ofertar casa</button>
        </div>
      </section>

      {apiMessage && <p className="api-message">{apiMessage}</p>}

      <section className="home-publicaciones">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando publicaciones...</p></div>
        ) : publicacionesFiltradas.length === 0 ? (
          <div className="sin-resultados"><p>No hay publicaciones disponibles</p></div>
        ) : (
          publicacionesFiltradas.map((pub) => (
            <article className="home-card" key={`${pub.origen || "publicacion"}-${pub.tipo || "publicacion"}-${pub.id}`}>
              {pub.tipo === "busco_roomie" ? (
                <>
                  {pub.imagen && <img src={pub.imagen} alt={pub.nombre} className="home-card-img" />}
                  <div className="home-card-body">
                    <div className="home-card-top">
                      <h3>{pub.nombre}{pub.edad ? `, ${pub.edad}` : ""}</h3>
                      <p className="home-ubicacion">Ubicacion: {pub.ubicacion}</p>
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
    </div>
  );
}
