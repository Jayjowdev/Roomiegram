import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import type { PreferenciasCompatibilidad } from "../types/auth";
import { preferenciasIniciales, preferenciasLabels } from "../utils/preferenciasCompatibilidad";

export default function Preferencias() {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasCompatibilidad>(user?.preferenciasCompatibilidad || preferenciasIniciales);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const mascotasLabel = preferenciasLabels.mascotas[preferencias.mascotas as keyof typeof preferenciasLabels.mascotas] || "Mascotas";
  const mascotasHelper = preferencias.mascotas === "mascotas"
    ? "Tu perfil destaca que aceptas convivir con mascotas."
    : preferencias.mascotas === "sin_mascotas"
      ? "Tu perfil indica que prefieres un hogar sin mascotas."
      : "Tu perfil indica que eres flexible con mascotas.";

  const validate = () => {
    if (!preferencias.limpieza || !preferencias.ambiente || !preferencias.horario || !preferencias.mascotas || !preferencias.fumar) {
      return "Completa todas tus preferencias.";
    }
    if (Number(preferencias.presupuesto) <= 0) {
      return "Ingresa un presupuesto mayor a cero.";
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const validationError = validate();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        preferenciasCompatibilidad: {
          ...preferencias,
          presupuesto: String(Number(preferencias.presupuesto)),
        },
      });
      setMessage("Preferencias guardadas.");
      navigate("/mi-perfil");
    } catch {
      setMessage("No se pudieron guardar las preferencias.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/configuracion")}>Configuración</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Tus preferencias de convivencia</h1>
        <p>Completa estos datos para que RoomieGram pueda mostrarte personas más compatibles contigo.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout single">
        <form className="module-form preferences-form" onSubmit={handleSubmit}>
          <h3>Preferencias de compatibilidad</h3>
          <p className="form-helper">Puedes editar estos datos después desde tu perfil.</p>

          <div className="compatibility-grid">
            <label className="field-label">
              Limpieza
              <select className="form-control" value={preferencias.limpieza} onChange={(e) => setPreferencias({ ...preferencias, limpieza: e.target.value })}>
                <option value="ordenado">Muy ordenado</option>
                <option value="intermedio">Orden intermedio</option>
                <option value="relajado">Relajado</option>
              </select>
            </label>

            <label className="field-label">
              Ambiente
              <select className="form-control" value={preferencias.ambiente} onChange={(e) => setPreferencias({ ...preferencias, ambiente: e.target.value })}>
                <option value="tranquilo">Ambiente tranquilo</option>
                <option value="social">Social</option>
                <option value="fiestas">Fiestas ocasionales</option>
              </select>
            </label>

            <label className="field-label">
              Horario
              <select className="form-control" value={preferencias.horario} onChange={(e) => setPreferencias({ ...preferencias, horario: e.target.value })}>
                <option value="madrugador">Madrugador</option>
                <option value="nocturno">Nocturno</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>

            <label className="field-label">
              Mascotas
              <select className="form-control" value={preferencias.mascotas} onChange={(e) => setPreferencias({ ...preferencias, mascotas: e.target.value })}>
                <option value="sin_mascotas">Sin mascotas</option>
                <option value="mascotas">Pet-friendly</option>
                <option value="indiferente_mascotas">Me da igual</option>
              </select>
              <span className={`pet-preference-badge pet-preference-${preferencias.mascotas}`}>{mascotasLabel}</span>
              <small className="pet-preference-helper">{mascotasHelper}</small>
            </label>

            <label className="field-label">
              Fumar
              <select className="form-control" value={preferencias.fumar} onChange={(e) => setPreferencias({ ...preferencias, fumar: e.target.value })}>
                <option value="no_fuma">No fumador</option>
                <option value="fuma">Fumador</option>
                <option value="indiferente_fuma">Me da igual</option>
              </select>
            </label>

            <label className="field-label">
              Presupuesto máximo
              <input className="form-control" type="number" min="1" value={preferencias.presupuesto} onChange={(e) => setPreferencias({ ...preferencias, presupuesto: e.target.value })} />
            </label>
          </div>

          <button className="btn btn-success w-100" disabled={isLoading || isSaving}>
            {isSaving ? "Guardando..." : "Guardar preferencias"}
          </button>
        </form>

        <aside className="module-list preferences-helper-card">
          <h3>Cuenta y seguridad</h3>
          <p>Actualiza tus datos personales o cambia tu contraseña desde Configuración.</p>
          <button className="btn btn-outline-success w-100" type="button" onClick={() => navigate("/configuracion")}>
            Ir a configuración
          </button>
        </aside>
      </section>
    </div>
  );
}
