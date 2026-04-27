import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { publicaciones as publicacionesDemo } from "../data/publicaciones";
import { publicacionService } from "../services/publicacionService";
import type { BackendPublicacion } from "../types/Backend";
import type { Publicacion } from "../types/Publicacion";

const fallbackGallery = [home1, home2, home3];

function mapBackendPublicacion(pub: BackendPublicacion): Publicacion {
  return {
    id: pub.id,
    tipo: "ofrezco_casa",
    nombre: pub.usuarioCreador || "RoomieGram",
    titulo: pub.titulo,
    precioMensual: pub.precio,
    precio: pub.precio,
    ubicacion: pub.ubicacion,
    descripcion: pub.descripcion,
    amenidades: [
      `${pub.numeroHabitaciones || 1} habitación(es)`,
      `${pub.numeroPersonas || 1} cupo(s)`,
      `${pub.numeroBanos || 1} baño(s)`,
    ],
    imagen: home1,
    galeria: fallbackGallery,
  };
}

export default function DetallePublicacion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [publicacion, setPublicacion] = useState<Publicacion | null>(
    publicacionesDemo.find((pub) => pub.tipo === "ofrezco_casa" && String(pub.id) === id) || null,
  );
  const [message, setMessage] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    publicacionService
      .listar()
      .then((data) => {
        const encontrada = data.map(mapBackendPublicacion).find((pub) => String(pub.id) === id);
        if (encontrada) {
          setPublicacion(encontrada);
          setMessage("");
        }
      })
      .catch(() => {
        if (!publicacion) {
          setMessage("No se pudo conectar con el servicio de publicaciones.");
        }
      });
  }, [id, publicacion]);

  const galeria = publicacion?.galeria?.length ? publicacion.galeria : fallbackGallery;

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/")} />
        </div>
        <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver</button>
      </header>

      {message && <p className="api-message">{message}</p>}
      {contactMessage && <p className="api-message">{contactMessage}</p>}

      {!publicacion ? (
        <div className="sin-resultados"><p>No se encontró la publicación.</p></div>
      ) : (
        <div className="detalle-publicacion">
          <section className="detalle-main">
            <div className="detalle-gallery">
              <img src={publicacion.imagen || galeria[0]} alt={publicacion.titulo || "Casa"} className="detalle-gallery-main" />
              <div className="detalle-gallery-thumbs">
                {galeria.map((imagen, index) => (
                  <img src={imagen} alt={`Imagen ${index + 1} de ${publicacion.titulo}`} key={`${imagen}-${index}`} />
                ))}
              </div>
            </div>
            <p className="home-ubicacion">Ubicación: {publicacion.ubicacion}</p>
            <h1>{publicacion.titulo}</h1>
            <p className="home-precio">${publicacion.precioMensual?.toLocaleString("es-CL")} / mes</p>
            <p className="detalle-desc">{publicacion.descripcion}</p>
            {publicacion.amenidades && (
              <div className="home-tags">
                {publicacion.amenidades.map((amenidad) => <span key={amenidad} className="home-tag amenidad-tag">{amenidad}</span>)}
              </div>
            )}
          </section>
          <aside className="detalle-side">
            <h3>Datos del anfitrión</h3>
            <p><strong>Nombre:</strong> {publicacion.nombre}</p>
            <p><strong>Edad:</strong> {publicacion.edad || "No informada"}</p>
            <p><strong>Tipo:</strong> Oferta de habitación/casa</p>
            <button className="btn btn-success w-100 mt-3" onClick={() => setContactMessage(`Solicitud enviada a ${publicacion.nombre}.`)}>
              Contactar
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
