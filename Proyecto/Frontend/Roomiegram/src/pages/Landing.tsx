import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import roomies from "../assets/COMPARTIR.jpg";
import { useAuth } from "../context/AuthContext";

const previewLinks = [
  { label: "Home", path: "/home" },
  { label: "Compatibilidad", path: "/compatibilidad" },
  { label: "Convivencia", path: "/convivencia" },
  { label: "Hogares", path: "/hogares" },
  { label: "Tareas", path: "/tareas" },
  { label: "Gastos", path: "/gastos" },
  { label: "Comprobantes", path: "/comprobantes" },
  { label: "Notificaciones", path: "/notificaciones" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const openPreview = (path: string) => {
    loginDemo();
    navigate(path);
  };

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
            <button className="btn btn-success" onClick={() => navigate("/register")}>
              Crear cuenta
            </button>

            <button className="btn btn-outline-dark" onClick={() => navigate("/login")}>
              Iniciar sesion
            </button>
          </div>

          <div className="preview-panel">
            <h3>Vista rapida del frontend</h3>
            <div className="preview-buttons">
              {previewLinks.map((link) => (
                <button className="btn btn-outline-success btn-sm" key={link.path} onClick={() => openPreview(link.path)}>
                  {link.label}
                </button>
              ))}
            </div>
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

      <footer className="landing-footer">
        <p>(c) 2026 Roomiegram - Proyecto academico</p>
      </footer>
    </div>
  );
}
