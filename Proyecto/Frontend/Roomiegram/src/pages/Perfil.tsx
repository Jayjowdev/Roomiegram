import { useMemo } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import type { Publicacion } from "../types/Publicacion"

export default function Perfil() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const publicacion = (location.state as { publicacion?: Publicacion } | null)?.publicacion

  const perfil = useMemo(
    () =>
      publicacion ?? {
        id: Number(id ?? 0),
        usuarioCreador: "Publicación",
        titulo: `Publicación ${id ?? "sin identificar"}`,
        ubicacion: "Sin ubicación cargada",
        descripcion: "Abre este perfil desde Home para ver el detalle completo de la publicación.",
        precio: 0,
        numeroHabitaciones: 0,
        numeroPersonas: 0,
        numeroBanos: 0,
      },
    [id, publicacion],
  )

  const intereses = [
    `${perfil.numeroHabitaciones} habitaciones`,
    `${perfil.numeroPersonas} personas`,
    `${perfil.numeroBanos} baños`,
  ]

  const hobbies = [
    `Publicado por ${perfil.usuarioCreador}`,
    `Presupuesto $${perfil.precio}`,
    `ID ${perfil.id}`,
  ]

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img
            src={logo}
            alt="RoomieGram"
            className="perfil-logo"
            onClick={() => navigate("/")}
          />
        </div>

        <button
          className="btn btn-outline-success"
          onClick={() => navigate("/home")}
        >
          Volver
        </button>
      </header>

      <div className="perfil-container">
        <div className="perfil-image perfil-image-placeholder">
          <div className="home-card-cover perfil-cover">
            <span>{perfil.usuarioCreador}</span>
          </div>
        </div>

        <div className="perfil-info">
          <h2>{perfil.titulo}</h2>
          <p className="perfil-ubicacion">📍 {perfil.ubicacion}</p>

          <p className="perfil-bio">{perfil.descripcion}</p>

          <div className="perfil-section">
            <h5>Intereses</h5>
            <div className="perfil-tags">
              {intereses.map((i, index) => (
                <span key={index} className="perfil-tag">{i}</span>
              ))}
            </div>
          </div>

          <div className="perfil-section">
            <h5>Resumen</h5>
            <div className="perfil-tags">
              {hobbies.map((h, index) => (
                <span key={index} className="perfil-tag secondary">{h}</span>
              ))}
            </div>
          </div>

          <button className="btn btn-success w-100 mt-4" onClick={() => navigate("/notificaciones")}>
            Ir a notificaciones
          </button>
        </div>
      </div>
    </div>
  )
}