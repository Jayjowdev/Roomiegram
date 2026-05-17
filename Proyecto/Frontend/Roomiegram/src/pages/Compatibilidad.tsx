import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";

const compatibilidadInicial = {
  limpieza: "ordenado",
  ambiente: "tranquilo",
  horario: "madrugador",
  mascotas: "sin_mascotas",
  fumar: "no_fuma",
  presupuesto: "280000",
};

export default function Compatibilidad() {
  const navigate = useNavigate();
  const [compatibilidad, setCompatibilidad] = useState(compatibilidadInicial);

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver al inicio</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
        </div>
      </header>

      <section className="module-title">
        <h1>Buscar por compatibilidad</h1>
        <p>Encuentra roomies con habitos, presupuesto y estilo de convivencia parecidos a los tuyos.</p>
      </section>

      <section className="compatibility-panel">
        <div className="compatibility-form">
          <span className="compatibility-kicker">Match inteligente</span>
          <h3>Tus preferencias</h3>
          <p>Ajusta tus habitos para buscar perfiles compatibles cuando haya usuarios disponibles.</p>
          <div className="compatibility-grid">
            <select className="form-control" value={compatibilidad.limpieza} onChange={(e) => setCompatibilidad({ ...compatibilidad, limpieza: e.target.value })}>
              <option value="ordenado">Muy ordenado</option>
              <option value="intermedio">Orden intermedio</option>
              <option value="relajado">Relajado</option>
            </select>
            <select className="form-control" value={compatibilidad.ambiente} onChange={(e) => setCompatibilidad({ ...compatibilidad, ambiente: e.target.value })}>
              <option value="tranquilo">Ambiente tranquilo</option>
              <option value="social">Social</option>
              <option value="fiestas">Fiestas ocasionales</option>
            </select>
            <select className="form-control" value={compatibilidad.horario} onChange={(e) => setCompatibilidad({ ...compatibilidad, horario: e.target.value })}>
              <option value="madrugador">Madrugador</option>
              <option value="nocturno">Nocturno</option>
              <option value="flexible">Flexible</option>
            </select>
            <select className="form-control" value={compatibilidad.mascotas} onChange={(e) => setCompatibilidad({ ...compatibilidad, mascotas: e.target.value })}>
              <option value="sin_mascotas">Sin mascotas</option>
              <option value="mascotas">Pet-friendly</option>
              <option value="indiferente_mascotas">Me da igual</option>
            </select>
            <select className="form-control" value={compatibilidad.fumar} onChange={(e) => setCompatibilidad({ ...compatibilidad, fumar: e.target.value })}>
              <option value="no_fuma">No fumador</option>
              <option value="fuma">Fumador</option>
              <option value="indiferente_fuma">Me da igual</option>
            </select>
            <input className="form-control" type="number" min="1" placeholder="Presupuesto maximo" value={compatibilidad.presupuesto} onChange={(e) => setCompatibilidad({ ...compatibilidad, presupuesto: e.target.value })} />
          </div>
        </div>

        <div className="compatibility-results">
          <div className="compatibility-results-title">
            <span>Mejores matches</span>
            <strong>0%</strong>
          </div>
          <div className="sin-resultados">
            <p>Aun no hay perfiles disponibles.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
