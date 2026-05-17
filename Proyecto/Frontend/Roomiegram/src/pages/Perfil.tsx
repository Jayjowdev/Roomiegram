import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";

export default function Perfil() {
  const navigate = useNavigate();

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/")} />
        </div>
        <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver</button>
      </header>
      <div className="sin-resultados">
        <p>Aun no hay perfiles disponibles.</p>
      </div>
    </div>
  );
}
