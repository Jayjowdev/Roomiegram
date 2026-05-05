import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import roomies from "../assets/COMPARTIR.jpg"

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img
          src={logo}
          alt="RoomieGram"
          className="landing-logo"
          onClick={() => navigate("/")}
        />
      </header>

      <section className="landing-hero">
        <div className="landing-text">
          <h1>Encuentra tu roomie ideal</h1>
          <p>
            Conecta con personas compatibles contigo, comparte gastos y organiza
            tu convivencia en un solo lugar.
          </p>

          <div className="landing-buttons">
            <button
              className="btn btn-success"
              onClick={() => navigate("/register")}
            >
              Crear cuenta
            </button>

            <button
              className="btn btn-outline-dark"
              onClick={() => navigate("/login")}
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        <div className="landing-image">
          <img src={roomies} alt="Roomies" />
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature-card">
          <h3>Encuentra compatibilidad</h3>
          <p>
            Conecta con personas según hábitos, intereses y estilo de vida.
          </p>
        </div>

        <div className="landing-feature-card">
          <h3>Organiza gastos</h3>
          <p>
            Divide cuentas y lleva control de pagos fácilmente.
          </p>
        </div>

        <div className="landing-feature-card">
          <h3>Convive mejor</h3>
          <p>
            Gestiona tareas, responsabilidades y comunicación en un solo lugar.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Roomiegram - Proyecto académico</p>
      </footer>
    </div>
  )
}