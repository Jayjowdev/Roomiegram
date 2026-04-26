import { useNavigate, useParams } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import img1 from "../assets/person1.jpeg"
import img2 from "../assets/person2.jpeg"
import img3 from "../assets/person3.jpeg"

export default function Perfil() {
  const navigate = useNavigate()
  const { id } = useParams()

  const perfiles = [
    {
      id: "1",
      nombre: "Sofía",
      edad: 24,
      bio: "Trabajo y estudio, soy ordenada y tranquila. Busco roomie responsable.",
      ubicacion: "Santiago Centro",
      intereses: ["Ordenada", "No fumadora", "Trabajo"],
      hobbies: ["Gym", "Series", "Cocinar"],
      imagen: img1,
    },
    {
      id: "2",
      nombre: "Camila",
      edad: 22,
      bio: "Estudiante, buena onda, me gustan los gatos y el ambiente tranquilo.",
      ubicacion: "Ñuñoa",
      intereses: ["Pet-friendly", "Estudiante", "Tranquila"],
      hobbies: ["Lectura", "Música", "Gatos"],
      imagen: img2,
    },
    {
      id: "3",
      nombre: "Daniela",
      edad: 27,
      bio: "Profesional, limpia y respetuosa. Busco alguien con rutina similar.",
      ubicacion: "Providencia",
      intereses: ["Profesional", "Ordenada", "Sin carrete"],
      hobbies: ["Running", "Cine", "Viajes"],
      imagen: img3,
    },
  ]

  const perfil = perfiles.find(p => p.id === id) || perfiles[0]

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
        <div className="perfil-image">
          <img src={perfil.imagen} alt={perfil.nombre} />
        </div>

        <div className="perfil-info">
          <h2>{perfil.nombre}, {perfil.edad}</h2>
          <p className="perfil-ubicacion">📍 {perfil.ubicacion}</p>

          <p className="perfil-bio">{perfil.bio}</p>

          <div className="perfil-section">
            <h5>Intereses</h5>
            <div className="perfil-tags">
              {perfil.intereses.map((i, index) => (
                <span key={index} className="perfil-tag">{i}</span>
              ))}
            </div>
          </div>

          <div className="perfil-section">
            <h5>Hobbies</h5>
            <div className="perfil-tags">
              {perfil.hobbies.map((h, index) => (
                <span key={index} className="perfil-tag secondary">{h}</span>
              ))}
            </div>
          </div>

          <button className="btn btn-success w-100 mt-4">
            Contactar
          </button>
        </div>
      </div>
    </div>
  )
}