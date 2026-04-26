import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"

export default function Dashboard() {
  const navigate = useNavigate()

  const actividades = [
    {
      texto: "Te contactó Camila",
      fecha: "Hace 2 horas",
    },
    {
      texto: "Publicaste un nuevo perfil",
      fecha: "Hace 1 día",
    },
    {
      texto: "Diego vio tu perfil",
      fecha: "Hace 2 días",
    },
  ]

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img
            src={logo}
            alt="RoomieGram"
            className="dashboard-logo"
            onClick={() => navigate("/home")}
          />
          
        </div>

        <button
          className="btn btn-outline-success"
          onClick={() => navigate("/home")}
        >
          Volver al inicio
        </button>
      </header>

      {/* STATS */}
      <section className="dashboard-stats">
        <div className="dashboard-card">
          <h5>Publicaciones</h5>
          <h2>12</h2>
        </div>

        <div className="dashboard-card">
          <h5>Mensajes</h5>
          <h2>5</h2>
        </div>

        <div className="dashboard-card">
          <h5>Interesados</h5>
          <h2>3</h2>
        </div>
      </section>

      {/* CONTENIDO */}
      <section className="dashboard-content">

        {/* ACTIVIDAD */}
        <div className="dashboard-activity">
          <h4>Actividad reciente</h4>

          {actividades.map((act, i) => (
            <div key={i} className="dashboard-activity-item">
              <span>{act.texto}</span>
              <span>{act.fecha}</span>
            </div>
          ))}
        </div>

        {/* PERFIL RÁPIDO */}
        <div className="dashboard-profile">
          <h4>Tu perfil</h4>

          <p><strong>Nombre:</strong> Usuario Demo</p>
          <p><strong>Ubicación:</strong> Santiago</p>
          <p><strong>Estado:</strong> Buscando roomie</p>

          <button className="btn btn-success w-100 mt-3">
            Editar perfil
          </button>
        </div>

      </section>
    </div>
  )
}