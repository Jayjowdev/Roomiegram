import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { eliminarNotificacion, listarNotificaciones } from "../services/notificacionService"
import type { Notificacion } from "../types/Notificacion"

export default function Notificaciones() {
  const navigate = useNavigate()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [actionError, setActionError] = useState("")

  async function loadNotificaciones() {
    setFetchError("")

    try {
      const response = await listarNotificaciones()
      setNotificaciones(response)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar las notificaciones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadNotificaciones()
  }, [])

  async function handleEliminar(id: number) {
    setActionError("")

    try {
      await eliminarNotificacion(id)
      await loadNotificaciones()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar la notificación")
    }
  }

  return (
    <div className="feature-page">
      <header className="feature-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/dashboard")} />

        <div className="feature-header-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/comprobantes")}>Comprobantes</button>
          <button className="btn btn-success" onClick={() => navigate("/dashboard")}>Dashboard</button>
        </div>
      </header>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Notificaciones</h2>
            <p>Vista conectada al microservicio de notificaciones.</p>
          </div>
        </div>

        {actionError ? <p className="form-error">{actionError}</p> : null}
        {isLoading ? <div className="feature-empty">Cargando notificaciones...</div> : null}
        {!isLoading && fetchError ? <div className="feature-empty">{fetchError}</div> : null}
        {!isLoading && !fetchError && notificaciones.length === 0 ? <div className="feature-empty">No hay notificaciones disponibles.</div> : null}

        {!isLoading && !fetchError && notificaciones.length > 0 ? (
          <div className="feature-list">
            {notificaciones.map((notificacion) => (
              <article key={notificacion.id} className="feature-item">
                <h3>{notificacion.titulo}</h3>
                <p><strong>Tipo:</strong> {notificacion.tipo}</p>
                <p><strong>Estado:</strong> {notificacion.estado}</p>
                <p>{notificacion.mensaje}</p>
                <p><strong>Creada:</strong> {notificacion.fechaCreacion}</p>

                <div className="feature-item-actions">
                  <button className="btn btn-outline-danger" onClick={() => void handleEliminar(notificacion.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}