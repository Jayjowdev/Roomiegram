import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import img1 from "../assets/person1.jpeg"
import img2 from "../assets/person2.jpeg"
import img3 from "../assets/person3.jpeg"

export default function Home() {
  const navigate = useNavigate()

  const publicaciones = [
    {
      id: 1,
      nombre: "Sofía",
      edad: 24,
      descripcion:
        "Trabajo y estudio, soy ordenada y tranquila. Busco roomie responsable.",
      ubicacion: "Santiago Centro",
      intereses: ["Ordenada", "No fumadora", "Trabajo"],
      imagen: img1,
    },
    {
      id: 2,
      nombre: "Camila",
      edad: 22,
      descripcion:
        "Estudiante, buena onda, me gustan los gatos y el ambiente tranquilo.",
      ubicacion: "Ñuñoa",
      intereses: ["Pet-friendly", "Estudiante", "Tranquila"],
      imagen: img2,
    },
    {
      id: 3,
      nombre: "Daniela",
      edad: 27,
      descripcion:
        "Profesional, limpia y respetuosa. Busco alguien con rutina similar.",
      ubicacion: "Providencia",
      intereses: ["Profesional", "Ordenada", "Sin carrete"],
      imagen: img3,
    },
  ]

  return (
    <div className="home-page">
      <header className="home-header">
        <img
          src={logo}
          alt="RoomieGram"
          className="home-logo"
          onClick={() => navigate("/")}
        />

        <div className="home-header-actions">
          <button
            className="btn btn-outline-success me-2"
            onClick={() => navigate("/")}
          >
            Inicio
          </button>

          <button
            className="btn btn-success"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Encuentra tu roomie ideal</h1>
          <p>
            Explora perfiles, descubre compatibilidades y conecta con personas
            que encajen contigo.
          </p>
        </div>
      </section>

      <section className="home-publicaciones">
        {publicaciones.map((pub) => (
          <article className="home-card" key={pub.id}>
            <img
              src={pub.imagen}
              alt={pub.nombre}
              className="home-card-img"
            />

            <div className="home-card-body">
              <div className="home-card-top">
                <h3>
                  {pub.nombre}, {pub.edad}
                </h3>
                <p className="home-ubicacion">📍 {pub.ubicacion}</p>
              </div>

              <p className="home-desc">{pub.descripcion}</p>

              <div className="home-tags">
                {pub.intereses.map((tag, i) => (
                  <span key={i} className="home-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                className="btn btn-success w-100 mt-4"
                onClick={() => navigate(`/perfil/${pub.id}`)}
              >
                Ver perfil
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}