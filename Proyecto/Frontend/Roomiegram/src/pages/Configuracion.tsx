import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

export default function Configuracion() {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountMessage("");
    setAccountError("");

    if (!user?.id) {
      setAccountError("Debes iniciar sesion para actualizar tus datos.");
      return;
    }

    if (nombre.trim().length < 2) {
      setAccountError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setIsSavingAccount(true);
      await updateProfile({ nombre: nombre.trim() });
      setAccountMessage("Datos de cuenta actualizados.");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "No se pudieron guardar los datos de cuenta.");
    } finally {
      setIsSavingAccount(false);
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
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "No se pudo cambiar la contrasena.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/mi-perfil")}>
            Mi perfil
          </button>
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Configuracion de cuenta</h1>
        <p>Administra tus datos personales, seguridad y accesos principales de Roomiegram.</p>
      </section>

      <section className="settings-layout">
        <form className="module-form settings-card" onSubmit={handleAccountSubmit}>
          <span className="eyebrow">Datos de cuenta</span>
          <h3>Informacion basica</h3>
          <p className="form-helper">Tu nombre se muestra en tu perfil. Usuario y correo quedan protegidos para no afectar el inicio de sesion.</p>
          {accountError && <div className="form-error">{accountError}</div>}
          {accountMessage && <div className="form-success">{accountMessage}</div>}

          <label className="field-label">
            <span>Nombre</span>
            <input
              className="form-control"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              disabled={isSavingAccount}
            />
          </label>
          <label className="field-label">
            <span>Usuario</span>
            <input className="form-control" value={user?.usuario || ""} readOnly />
          </label>
          <label className="field-label">
            <span>Correo</span>
            <input className="form-control" value={user?.correo || ""} readOnly />
          </label>
          <button className="btn btn-success w-100" type="submit" disabled={isLoading || isSavingAccount}>
            {isSavingAccount ? "Guardando..." : "Guardar datos"}
          </button>
        </form>

        <form className="module-form settings-card" onSubmit={handleChangePassword}>
          <span className="eyebrow">Seguridad</span>
          <h3>Cambiar contrasena</h3>
          <p className="form-helper">Usa tu contrasena temporal o actual para definir una nueva.</p>
          {passwordError && <div className="form-error">{passwordError}</div>}
          {passwordMessage && <div className="form-success">{passwordMessage}</div>}
          <div className="password-input-group">
            <input
              className="form-control"
              type={mostrarContrasena ? "text" : "password"}
              placeholder="Contrasena actual"
              value={contrasenaActual}
              onChange={(event) => setContrasenaActual(event.target.value)}
              disabled={isChangingPassword}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarContrasena((valorActual) => !valorActual)}
              disabled={isChangingPassword}
              aria-label={mostrarContrasena ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {mostrarContrasena ? "Ocultar" : "Ver"}
            </button>
          </div>
          <input
            className="form-control"
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Nueva contrasena"
            value={nuevaContrasena}
            onChange={(event) => setNuevaContrasena(event.target.value)}
            disabled={isChangingPassword}
          />
          <input
            className="form-control"
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Confirmar nueva contrasena"
            value={confirmarContrasena}
            onChange={(event) => setConfirmarContrasena(event.target.value)}
            disabled={isChangingPassword}
          />
          <button className="btn btn-success w-100" type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? "Actualizando..." : "Actualizar contrasena"}
          </button>
        </form>

        <aside className="module-list settings-card settings-shortcuts">
          <span className="eyebrow">Accesos utiles</span>
          <h3>Cuenta y perfil</h3>
          <button className="btn btn-outline-success w-100" type="button" onClick={() => navigate("/mi-perfil")}>
            Volver a Mi perfil
          </button>
          <button className="btn btn-outline-success w-100" type="button" onClick={() => navigate(`/perfil-publico/${user?.id}`)}>
            Ver perfil publico
          </button>
          <button className="btn btn-outline-success w-100" type="button" onClick={() => navigate("/preferencias")}>
            Ir a preferencias
          </button>
        </aside>
      </section>
    </div>
  );
}
