import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import img1 from "../assets/person1.jpeg";
import img2 from "../assets/person2.jpeg";
import img3 from "../assets/person3.jpeg";
import avatar4 from "../assets/avatar4.svg";
import avatarUser from "../assets/avatarUser.svg";
import { useAuth } from "../context/AuthContext";

const grupoRoomie = [
  { nombre: "Sofía", rol: "Arriendo", estado: "Al día", imagen: img1 },
  { nombre: "Camila", rol: "Servicios", estado: "Pendiente luz", imagen: img2 },
  { nombre: "Daniela", rol: "Compras", estado: "Turno cocina", imagen: img3 },
];

export default function MiPerfil() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/home")} />
        </div>

        <button className="btn btn-outline-success" onClick={() => navigate("/home")}>
          Volver al inicio
        </button>
      </header>

      <section className="mi-perfil-hero">
        <div className="mi-perfil-card">
          <img src={avatarUser} alt="Martina" />
          <div>
            <span className="demo-kicker">Mi perfil</span>
            <h1>{user?.nombre || "Martina"}</h1>
            <p>Busco convivencia tranquila, ordenada y con buena comunicación.</p>
            <div className="home-tags">
              <span className="home-tag">No fumador</span>
              <span className="home-tag">Madrugador</span>
              <span className="home-tag">Ordenado</span>
              <span className="home-tag">Pet-friendly</span>
            </div>
          </div>
        </div>

        <aside className="mi-perfil-summary">
          <h3>Compatibilidad activa</h3>
          <strong>86%</strong>
          <p>Tu perfil encaja mejor con personas tranquilas, ordenadas y con presupuesto similar.</p>
          <button className="btn btn-success w-100" onClick={() => navigate("/compatibilidad")}>
            Buscar matches
          </button>
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/home?crear=1")}>
            Crear publicación
          </button>
        </aside>
      </section>

      <section className="mi-grupo">
        <div className="mi-grupo-header">
          <h2>Mi grupo roomie</h2>
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>
            Ver panel convivencia
          </button>
        </div>

        <div className="mi-grupo-grid">
          {grupoRoomie.map((persona) => (
            <article className="mi-roomie-card" key={persona.nombre}>
              <img src={persona.imagen} alt={persona.nombre} />
              <div>
                <h3>{persona.nombre}</h3>
                <p>{persona.rol}</p>
                <span>{persona.estado}</span>
              </div>
            </article>
          ))}
          <article className="mi-roomie-card">
            <img src={avatar4} alt="Valentina" />
            <div>
              <h3>Valentina</h3>
              <p>Match sugerido</p>
              <span>92% compatible</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
