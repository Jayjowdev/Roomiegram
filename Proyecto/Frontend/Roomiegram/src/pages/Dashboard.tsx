import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { useAuth } from "../context/AuthContext"
import { listarHogares } from "../services/hogarService"
import { listarNotificaciones } from "../services/notificacionService"
import { listarPublicaciones } from "../services/publicacionService"
import { listarTareas } from "../services/tareaService"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    publicaciones: 0,
    tareas: 0,
    notificaciones: 0,
    hogares: 0,
  })
  const [loadError, setLoadError] = useState("")

  const actividades = [
    {
      texto: "Tus formularios ahora validan antes de llamar a cada microservicio",
      fecha: "Validación activa",
    },
    {
      texto: "El dashboard ya consume publicaciones, tareas, hogares y notificaciones",
      fecha: "Axios listo",
    },
    {
      texto: "Puedes cerrar sesión y proteger rutas privadas con localStorage",
      fecha: "AuthContext",
    },
  ]

  useEffect(() => {
    async function loadStats() {
      setLoadError("")

      try {
        const [publicaciones, tareas, notificaciones, hogares] = await Promise.all([
          listarPublicaciones(),
          listarTareas(),
          listarNotificaciones(),
          listarHogares(),
        ])

        setStats({
          publicaciones: publicaciones.length,
          tareas: tareas.length,
          notificaciones: notificaciones.length,
          hogares: hogares.length,
        })
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las métricas")
      }
    }

    void loadStats()
  }, [])

  function handleLogout() {
    logout()
    navigate("/")
  }

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

        <div className="dashboard-header-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          <button className="btn btn-success" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* STATS */}
      <section className="dashboard-stats">
        <div className="dashboard-card">
          <h5>Publicaciones</h5>
          <h2>{stats.publicaciones}</h2>
        </div>

        <div className="dashboard-card">
          <h5>Tareas</h5>
          <h2>{stats.tareas}</h2>
        </div>

        <div className="dashboard-card">
          <h5>Notificaciones</h5>
          <h2>{stats.notificaciones}</h2>
        </div>

        <div className="dashboard-card">
          <h5>Hogares</h5>
          <h2>{stats.hogares}</h2>
        </div>
      </section>

      {loadError ? <p className="form-error">{loadError}</p> : null}

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

          <p><strong>Nombre:</strong> {user?.nombre ?? "Sin sesión"}</p>
          <p><strong>Correo:</strong> {user?.correo ?? "-"}</p>
          <p><strong>Usuario:</strong> @{user?.usuario ?? "-"}</p>
          <p><strong>Rol:</strong> {user?.role ?? "USER"}</p>

          <div className="dashboard-shortcuts mt-4">
            <button className="btn btn-success w-100" onClick={() => navigate("/hogares")}>Hogares</button>
            <button className="btn btn-outline-success w-100" onClick={() => navigate("/tareas")}>Tareas</button>
            <button className="btn btn-outline-success w-100" onClick={() => navigate("/gastos")}>Gastos</button>
            <button className="btn btn-outline-success w-100" onClick={() => navigate("/comprobantes")}>Comprobantes</button>
            <button className="btn btn-outline-success w-100" onClick={() => navigate("/notificaciones")}>Notificaciones</button>
          </div>
        </div>

      </section>
    </div>
  )
}