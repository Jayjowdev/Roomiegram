import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import type { PreferenciasCompatibilidad } from "../types/auth";
import { preferenciasIniciales } from "../utils/preferenciasCompatibilidad";

export default function Preferencias() {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasCompatibilidad>(user?.preferenciasCompatibilidad || preferenciasIniciales);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!user?.id) {
      setPasswordError("Debes iniciar sesion para cambiar tu contrasena.");
      return;
    }

    if (!contrasenaActual.trim()) {
      setPasswordError("Ingresa tu contrasena actual.");
      return;
    }

    if (nuevaContrasena.length < 8) {
      setPasswordError("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setPasswordError("La nueva contrasena y la confirmacion no coinciden.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await authService.changePassword(user.id, {
        contrasenaActual,
        nuevaContrasena,
        confirmarContrasena,
      });
      setPasswordMessage(response.mensaje || "Contrasena actualizada correctamente.");
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "No se pudo cambiar la contrasena.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Tus preferencias de convivencia</h1>
        <p>Completa estos datos para que RoomieGram pueda mostrarte personas mas compatibles contigo.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout single">
        <form className="module-form preferences-form" onSubmit={handleSubmit}>
          <h3>Preferencias de compatibilidad</h3>
          <p className="form-helper">Puedes editar estos datos despues desde tu perfil.</p>

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
              Presupuesto maximo
              <input className="form-control" type="number" min="1" value={preferencias.presupuesto} onChange={(e) => setPreferencias({ ...preferencias, presupuesto: e.target.value })} />
            </label>
          </div>

          <button className="btn btn-success w-100" disabled={isLoading || isSaving}>
            {isSaving ? "Guardando..." : "Guardar preferencias"}
          </button>
        </form>

        <form className="module-form profile-password-form" onSubmit={handleChangePassword}>
          <h3>Cambiar contrasena</h3>
          <p className="form-helper">Usa tu contrasena temporal o actual para definir una nueva.</p>
          {passwordError && <div className="form-error">{passwordError}</div>}
          {passwordMessage && <div className="form-success">{passwordMessage}</div>}
          <input
            className="form-control"
            type="password"
            placeholder="Contrasena actual"
            value={contrasenaActual}
            onChange={(event) => setContrasenaActual(event.target.value)}
            disabled={isChangingPassword}
          />
          <input
            className="form-control"
            type="password"
            placeholder="Nueva contrasena"
            value={nuevaContrasena}
            onChange={(event) => setNuevaContrasena(event.target.value)}
            disabled={isChangingPassword}
          />
          <input
            className="form-control"
            type="password"
            placeholder="Confirmar nueva contrasena"
            value={confirmarContrasena}
            onChange={(event) => setConfirmarContrasena(event.target.value)}
            disabled={isChangingPassword}
          />
          <button className="btn btn-success w-100" type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? "Actualizando..." : "Actualizar contrasena"}
          </button>
        </form>
      </section>
    </div>
  );
}
