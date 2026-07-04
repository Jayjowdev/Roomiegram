import { type CSSProperties, type RefObject, useRef } from "react";
import { useNavigate } from "react-router-dom";
import avatar4 from "../assets/avatar4.svg";
import avatar5 from "../assets/avatar5.svg";
import avatar6 from "../assets/avatar6.svg";
import avatarUser from "../assets/avatarUser.svg";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import logo from "../assets/Logo-removebg-preview.png";
import roomies from "../assets/COMPARTIR.jpg";

const TESTIMONIOS = [
  {
    id: 1,
    avatar: avatar4,
    nombre: "Valentina R.",
    texto: "Gracias a Roomiegram encontré el lugar y las personas ideales para compartir. No podría pedir mejores roomies.",
  },
  {
    id: 2,
    avatar: avatar5,
    nombre: "Sebastián M.",
    texto: "Dividir los gastos nunca fue tan fácil. Con Roomiegram todo queda registrado y evitamos malentendidos.",
  },
  {
    id: 3,
    avatar: avatarUser,
    nombre: "Camila T.",
    texto: "La compatibilidad de hábitos fue clave. Me conectó con personas que tienen mi mismo ritmo de vida.",
  },
  {
    id: 4,
    avatar: avatar6,
    nombre: "Diego P.",
    texto: "Organizar las tareas del hogar nunca había sido tan sencillo. Todos sabemos qué toca hacer cada semana.",
  },
  {
    id: 5,
    avatar: avatar4,
    nombre: "Javiera L.",
    texto: "Encontré habitación en menos de una semana. Los comprobantes y la gestión del hogar me dieron mucha tranquilidad.",
  },
];

const PROPIEDADES = [
  { id: 1, imagen: home1, nombre: "Apartamento en Santiago Centro", precio: 220000, habitaciones: 3, personas: 4 },
  { id: 2, imagen: home2, nombre: "Casa con jardín en Providencia", precio: 310000, habitaciones: 4, personas: 5 },
  { id: 3, imagen: home3, nombre: "Departamento moderno en Ñuñoa", precio: 185000, habitaciones: 2, personas: 3 },
  { id: 4, imagen: home1, nombre: "Pieza amplia en Las Condes", precio: 280000, habitaciones: 3, personas: 4 },
  { id: 5, imagen: home2, nombre: "Loft compartido en Barrio Italia", precio: 260000, habitaciones: 2, personas: 3 },
];

const USUARIOS_DESTACADOS = [
  { id: 1, avatar: avatar4, nombre: "Valentina R.", descripcion: "Amo cocinar y hacer yoga. Busco ambiente tranquilo.", compatibilidad: 95 },
  { id: 2, avatar: avatar5, nombre: "Sebastián M.", descripcion: "Estudiante de ingeniería, ordenado y tranquilo.", compatibilidad: 88 },
  { id: 3, avatar: avatar6, nombre: "Javiera L.", descripcion: "Trabajo remoto. Me gusta mantener el hogar limpio.", compatibilidad: 91 },
  { id: 4, avatar: avatarUser, nombre: "Diego P.", descripcion: "Fan del deporte y la vida sana. Prefiere hogar sin mascotas.", compatibilidad: 83 },
  { id: 5, avatar: avatar4, nombre: "Camila T.", descripcion: "Creativa, sociable y amante de la música.", compatibilidad: 79 },
];

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function CarouselArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      className={`carousel-arrow carousel-arrow-${dir}`}
      onClick={onClick}
      aria-label={dir === "left" ? "Anterior" : "Siguiente"}
      type="button"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const testimoniosRef = useRef<HTMLDivElement>(null);
  const propiedadesRef = useRef<HTMLDivElement>(null);
  const usuariosRef = useRef<HTMLDivElement>(null);

  function scroll(ref: RefObject<HTMLDivElement | null>, dir: "left" | "right") {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src={logo} alt="Roomiegram" className="landing-logo" onClick={() => navigate("/")} />
      </header>

      <section className="landing-hero">
        <div className="landing-text">
          <h1>Encuentra tu roomie ideal</h1>
          <p>Conecta con personas compatibles contigo, comparte gastos y organiza tu convivencia en un solo lugar.</p>

          <div className="landing-buttons">
            <button className="btn btn-success" onClick={() => navigate("/register")} type="button">
              Crear cuenta
            </button>

            <button className="btn btn-outline-dark" onClick={() => navigate("/login")} type="button">
              Iniciar sesión
            </button>
          </div>
        </div>

        <div className="landing-image">
          <img src={roomies} alt="Roomies compartiendo hogar" />
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature-card">
          <h3>Encuentra compatibilidad</h3>
          <p>Conecta con personas según hábitos, intereses y estilo de vida.</p>
        </div>

        <div className="landing-feature-card">
          <h3>Organiza gastos</h3>
          <p>Registra gastos del hogar y respalda acuerdos con comprobantes.</p>
        </div>

        <div className="landing-feature-card">
          <h3>Convive mejor</h3>
          <p>Gestiona tareas, responsabilidades y comunicación en un solo lugar.</p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <div>
            <h2 className="landing-section-title">Lo que dicen nuestros usuarios</h2>
            <p className="landing-section-sub">Historias de personas que encontraron un hogar más compatible.</p>
          </div>
          <div className="carousel-controls">
            <CarouselArrow dir="left" onClick={() => scroll(testimoniosRef, "left")} />
            <CarouselArrow dir="right" onClick={() => scroll(testimoniosRef, "right")} />
          </div>
        </div>

        <div className="carousel-track" ref={testimoniosRef}>
          {TESTIMONIOS.map((testimonio) => (
            <article className="testimonial-card" key={testimonio.id}>
              <svg className="testimonial-quote" viewBox="0 0 40 28" aria-hidden="true" fill="currentColor">
                <path d="M0 28Q0 13 15 0h8Q11 13 13 28H0zm22 0Q22 13 37 0h8Q33 13 35 28H22z" />
              </svg>
              <p className="testimonial-text">"{testimonio.texto}"</p>
              <div className="testimonial-author">
                <img src={testimonio.avatar} alt={testimonio.nombre} className="testimonial-avatar" />
                <span className="testimonial-name">{testimonio.nombre}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <div>
            <h2 className="landing-section-title">Propiedades destacadas</h2>
            <p className="landing-section-sub">Espacios disponibles para empezar tu búsqueda con confianza.</p>
          </div>
          <div className="carousel-controls">
            <CarouselArrow dir="left" onClick={() => scroll(propiedadesRef, "left")} />
            <CarouselArrow dir="right" onClick={() => scroll(propiedadesRef, "right")} />
          </div>
        </div>

        <div className="carousel-track" ref={propiedadesRef}>
          {PROPIEDADES.map((propiedad) => (
            <article className="propiedad-card" key={propiedad.id}>
              <div className="propiedad-img-wrap">
                <img src={propiedad.imagen} alt={propiedad.nombre} className="propiedad-img" />
              </div>
              <div className="propiedad-body">
                <h4 className="propiedad-nombre">{propiedad.nombre}</h4>
                <p className="propiedad-precio">
                  {formatCLP(propiedad.precio)} <span>/ mes</span>
                </p>
                <div className="propiedad-meta">
                  <span>{propiedad.habitaciones} hab.</span>
                  <span>{propiedad.personas} personas</span>
                </div>
                <button className="btn btn-success propiedad-btn" onClick={() => navigate("/register")} type="button">
                  Ver más
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <div>
            <h2 className="landing-section-title">Roomies destacados</h2>
            <p className="landing-section-sub">Conoce perfiles compatibles antes de decidir con quién vivir.</p>
          </div>
          <div className="carousel-controls">
            <CarouselArrow dir="left" onClick={() => scroll(usuariosRef, "left")} />
            <CarouselArrow dir="right" onClick={() => scroll(usuariosRef, "right")} />
          </div>
        </div>

        <div className="carousel-track" ref={usuariosRef}>
          {USUARIOS_DESTACADOS.map((usuario) => (
            <article className="usuario-card" key={usuario.id}>
              <img src={usuario.avatar} alt={usuario.nombre} className="usuario-avatar" />
              <h4 className="usuario-nombre">{usuario.nombre}</h4>
              <p className="usuario-desc">{usuario.descripcion}</p>
              <div className="usuario-compat">
                <span className="usuario-compat-bar">
                  <span
                    className="usuario-compat-fill"
                    style={{ "--compat": `${usuario.compatibilidad}%` } as CSSProperties}
                  />
                </span>
                <span className="usuario-compat-label">{usuario.compatibilidad}% compatibilidad</span>
              </div>
              <button className="btn btn-outline-success usuario-btn" onClick={() => navigate("/register")} type="button">
                Conectar
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <h2>¿Listo para encontrar tu hogar ideal?</h2>
        <p>Únete a Roomiegram y organiza búsqueda, convivencia, tareas y gastos desde un solo lugar.</p>
        <div className="landing-cta-actions">
          <button className="btn landing-cta-btn" onClick={() => navigate("/register")} type="button">
            Comenzar gratis
          </button>
          <button
            className="btn landing-cta-support"
            onClick={() => {
              window.location.href = "mailto:soporte@roomiegram.com?subject=Soporte%20Roomiegram";
            }}
            type="button"
          >
            Contactar soporte
          </button>
        </div>
        <small className="landing-cta-help">También puedes escribir a soporte@roomiegram.com</small>
      </section>

      <footer className="landing-footer">
        <p>(c) 2026 Roomiegram - Proyecto académico</p>
      </footer>
    </div>
  );
}
