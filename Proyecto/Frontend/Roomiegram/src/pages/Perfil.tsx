import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { publicaciones } from "../data/publicaciones";

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState("");

  const perfil = publicaciones.find((publicacion) => publicacion.tipo === "busco_roomie" && String(publicacion.id) === id) ||
    publicaciones.find((publicacion) => publicacion.tipo === "busco_roomie");

  if (!perfil) return null;

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/")} />
        </div>
        <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver</button>
      </header>

      {message && <p className="api-message">{message}</p>}

      <div className="perfil-container">
        <div className="perfil-image">{perfil.imagen && <img src={perfil.imagen} alt={perfil.nombre} />}</div>
        <div className="perfil-info">
          <h2>{perfil.nombre}{perfil.edad ? `, ${perfil.edad}` : ""}</h2>
          <p className="perfil-ubicacion">Ubicación: {perfil.ubicacion}</p>
          <p className="perfil-bio">{perfil.descripcion}</p>
          <div className="perfil-section">
            <h5>Intereses</h5>
            <div className="perfil-tags">
              {perfil.intereses?.map((interes) => <span key={interes} className="perfil-tag">{interes}</span>)}
            </div>
          </div>
          <button className="btn btn-success w-100 mt-4" onClick={() => setMessage(`Solicitud de contacto enviada a ${perfil.nombre}.`)}>
            Contactar
          </button>
        </div>
      </div>
    </div>
  );
}
