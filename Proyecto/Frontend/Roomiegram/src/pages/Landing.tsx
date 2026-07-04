import { useRef } from "react";
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

const TESTIMONIALS = [
  { id: 1, avatar: avatar4, nombre: "Valentina R.", texto: "Gracias a Roomiegram encontr\u00e9 el lugar y las personas ideales para compartir. \u00a1No podr\u00eda pedir mejores roomies!" },
  { id: 2, avatar: avatar5, nombre: "Sebasti\u00e1n M.", texto: "Dividir los gastos nunca fue tan f\u00e1cil. Con Roomiegram todo queda registrado y evitamos malentendidos." },
  { id: 3, avatar: avatarUser, nombre: "Camila T.", texto: "La compatibilidad de h\u00e1bitos fue clave. Me emparej\u00f3 con personas que tienen mi mismo ritmo de vida." },
  { id: 4, avatar: avatar6, nombre: "Diego P.", texto: "Organizar las tareas del hogar nunca hab\u00eda sido tan sencillo. Todos sabemos qu\u00e9 toca hacer cada semana." },
  { id: 5, avatar: avatar4, nombre: "Javiera L.", texto: "Encontr\u00e9 piso en menos de una semana. La pasarela de pago y los comprobantes me dieron total tranquilidad." },
];

const PROPIEDADES = [
  { id: 1, imagen: home1, nombre: "Apartamento en Santiago Centro", precio: 220000, habitaciones: 3, personas: 4 },
  { id: 2, imagen: home2, nombre: "Casa con jard\u00edn en Providencia", precio: 310000, habitaciones: 4, personas: 5 },
  { id: 3, imagen: home3, nombre: "Departamento moderno en \u00d1u\u00f1oa", precio: 185000, habitaciones: 2, personas: 3 },
  { id: 4, imagen: home1, nombre: "Penthouse en Las Condes", precio: 450000, habitaciones: 3, personas: 4 },
  { id: 5, imagen: home2, nombre: "Loft en Barrio Italia", precio: 260000, habitaciones: 2, personas: 3 },
];

const USUARIOS = [
  { id: 1, avatar: avatar4, nombre: "Valentina R.", descripcion: "Amo cocinar y hacer yoga. Busco ambiente tranquilo.", compatibilidad: 95 },
  { id: 2, avatar: avatar5, nombre: "Sebasti\u00e1n M.", descripcion: "Estudiante de ingenier\u00eda, ordenado y tranquilo.", compatibilidad: 88 },
  { id: 3, avatar: avatar6, nombre: "Javiera L.", descripcion: "Trabajo remoto. Me gusta mantener el hogar limpio.", compatibilidad: 91 },
  { id: 4, avatar: avatarUser, nombre: "Diego P.", descripcion: "Fan del deporte y la vida sana. Sin mascotas.", compatibilidad: 83 },
  { id: 5, avatar: avatar4, nombre: "Camila T.", descripcion: "Noct\u00e1mbula, creativa y sociable. Amo la m\u00fasica.", compatibilidad: 79 },
];

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function CarouselArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button className={`carousel-arrow carousel-arrow-${dir}`} onClick={onClick} aria-label={dir === "left" ? "Anterior" : "Siguiente"}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const propiedadesRef = useRef<HTMLDivElement>(null);
  const usuariosRef = useRef<HTMLDivElement>(null);

  function scroll(ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src={logo} alt="RoomieGram" className="landing-logo" onClick={() => navigate("/")} />
      </header>

      <section className="landing-hero">
        <div className="landing-text">
          <h1>Encuentra tu roomie ideal</h1>
          <p>Conecta con personas compatibles contigo, comparte gastos y organiza tu convivencia en un solo lugar.</p>
          <div className="landing-buttons">
            <button className="btn btn-success" onClick={() => navigate("/register")}>Crear cuenta</button>
            <button className="btn btn-outline-dark" onClick={() => navigate("/login")}>Iniciar sesion</button>
          </div>
        </div>
        <div className="landing-image">
          <img src={roomies} alt="Roomies" />
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature-card">
          <h3>Encuentra compatibilidad</h3>
          <p>Conecta con personas segun habitos, intereses y estilo de vida.</p>
        </div>
        <div className="landing-feature-card">
          <h3>Organiza gastos</h3>
          <p>Divide cuentas y lleva control de pagos facilmente.</p>
        </div>
        <div className="landing-feature-card">
          <h3>Convive mejor</h3>
          <p>Gestiona tareas, responsabilidades y comunicacion en un solo lugar.</p>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div>
            <h2 className="landing-section-title">Lo que dicen nuestros usuarios</h2>
            <p className="landing-section-sub">Historias reales de personas que encontraron su hogar ideal</p>
          </div>
          <div className="carousel-controls">
            <CarouselArrow dir="left" onClick={() => scroll(testimonialsRef, "left")} />
            <CarouselArrow dir="right" onClick={() => scroll(testimonialsRef, "right")} />
          </div>
        </div>
        <div className="carousel-track" ref={testimonialsRef}>
          {TESTIMONIALS.map((t) => (
            <article className="testimonial-card" key={t.id}>
              <svg className="testimonial-quote" viewBox="0 0 40 28" aria-hidden="true" fill="currentColor">
                <path d="M0 28Q0 13 15 0h8Q11 13 13 28H0zm22 0Q22 13 37 0h8Q33 13 35 28H22z" />
              </svg>
              <p className="testimonial-text">&ldquo;{t.texto}&rdquo;</p>
              <div className="testimonial-author">
                <img src={t.avatar} alt={t.nombre} className="testimonial-avatar" />
                <span className="testimonial-name">{t.nombre}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PROPIEDADES */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <div>
            <h2 className="landing-section-title">Propiedades destacadas</h2>
            <p className="landing-section-sub">Espacios disponibles para compartir con otros roomies</p>
          </div>
          <div className="carousel-controls">
            <CarouselArrow dir="left" onClick={() => scroll(propiedadesRef, "left")} />
            <CarouselArrow dir="right" onClick={() => scroll(propiedadesRef, "right")} />
          </div>
        </div>
        <div className="carousel-track" ref={propiedadesRef}>
          {PROPIEDADES.map((p) => (
            <article className="propiedad-card" key={p.id}>
              <div className="propiedad-img-wrap">
                <img src={p.imagen} alt={p.nombre} className="propiedad-img" />
              </div>
              <div className="propiedad-body">
                <h4 className="propiedad-nombre">{p.nombre}</h4>
                <p className="propiedad-precio">{formatCLP(p.precio)} <span>/ mes</span></p>
                <div className="propiedad-meta">
                  <span>{p.habitaciones} hab.</span>
                  <span>{p.personas} personas</span>
                </div>
                <button className="btn btn-success propiedad-btn" onClick={() => navigate("/register")}>Ver más</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* USUARIOS DESTACADOS */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div>
            <h2 className="landing-section-title">Usuarios destacados</h2>
            <p className="landing-section-sub">Conoce a personas buscando roomie como tú</p>
          </div>
          <div className="carousel-controls">
            <CarouselArrow dir="left" onClick={() => scroll(usuariosRef, "left")} />
            <CarouselArrow dir="right" onClick={() => scroll(usuariosRef, "right")} />
          </div>
        </div>
        <div className="carousel-track" ref={usuariosRef}>
          {USUARIOS.map((u) => (
            <article className="usuario-card" key={u.id}>
              <img src={u.avatar} alt={u.nombre} className="usuario-avatar" />
              <h4 className="usuario-nombre">{u.nombre}</h4>
              <p className="usuario-desc">{u.descripcion}</p>
              <div className="usuario-compat">
                <span className="usuario-compat-bar">
                  <span className="usuario-compat-fill" style={{ '--compat': `${u.compatibilidad}%` } as React.CSSProperties} />
                </span>
                <span className="usuario-compat-label">{u.compatibilidad}% compatibilidad</span>
              </div>
              <button className="btn btn-outline-success usuario-btn" onClick={() => navigate("/register")}>Conectar</button>
            </article>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="landing-cta">
        <h2>¿Listo para encontrar tu hogar ideal?</h2>
        <p>Únete a cientos de roomies que ya organizan su convivencia con Roomiegram.</p>
        <button className="btn landing-cta-btn" onClick={() => navigate("/register")}>Comenzar gratis</button>
      </section>

      <footer className="landing-footer">
        <p>(c) 2026 Roomiegram - Proyecto academico</p>
      </footer>
    </div>
  );
}
