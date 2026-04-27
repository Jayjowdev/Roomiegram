import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { publicaciones } from "../data/publicaciones";

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

  const matchesCompatibles = useMemo(() => {
    const preferencias = [
      compatibilidad.limpieza,
      compatibilidad.ambiente,
      compatibilidad.horario,
      compatibilidad.mascotas,
      compatibilidad.fumar,
    ];
    const presupuesto = Number(compatibilidad.presupuesto) || 0;

    return publicaciones
      .filter((pub) => pub.tipo === "busco_roomie")
      .map((pub) => {
        const coincidencias = preferencias.filter((preferencia) => pub.habitos?.includes(preferencia)).length;
        const presupuestoOk = !pub.presupuestoMaximo || presupuesto >= pub.presupuestoMaximo;
        const puntaje = Math.round(((coincidencias + (presupuestoOk ? 1 : 0)) / 6) * 100);

        return { ...pub, puntaje };
      })
      .sort((a, b) => b.puntaje - a.puntaje);
  }, [compatibilidad]);

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
        <p>Encuentra roomies con hábitos, presupuesto y estilo de convivencia parecidos a los tuyos.</p>
      </section>

      <section className="compatibility-panel">
        <div className="compatibility-form">
          <span className="compatibility-kicker">Match inteligente</span>
          <h3>Tus preferencias</h3>
          <p>Ajusta tus hábitos y revisa qué personas encajan mejor contigo.</p>
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
            <input className="form-control" type="number" min="1" placeholder="Presupuesto máximo" value={compatibilidad.presupuesto} onChange={(e) => setCompatibilidad({ ...compatibilidad, presupuesto: e.target.value })} />
          </div>
        </div>

        <div className="compatibility-results">
          <div className="compatibility-results-title">
            <span>Mejores matches</span>
            <strong>{matchesCompatibles[0]?.puntaje || 0}%</strong>
          </div>
          {matchesCompatibles.map((match) => (
            <button className="compatibility-match" key={match.id} onClick={() => navigate(`/perfil/${match.id}`)}>
              {match.imagen && <img src={match.imagen} alt={match.nombre} />}
              <span className="match-copy">
                <span className="match-topline">
                  <strong>{match.puntaje}% compatible</strong>
                  <span className="match-score-bar"><span style={{ width: `${match.puntaje}%` }} /></span>
                </span>
                <span className="match-name">{match.nombre}</span>
                <small>{match.ubicacion}</small>
                <span className="match-tags">
                  {match.intereses?.slice(0, 2).map((interes) => <em key={interes}>{interes}</em>)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
