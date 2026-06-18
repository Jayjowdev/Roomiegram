import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import roomies from "../assets/login.png";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [localError, setLocalError] = useState("");
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [recuperacionMensaje, setRecuperacionMensaje] = useState("");
  const [recuperacionError, setRecuperacionError] = useState("");
  const [recuperandoContrasena, setRecuperandoContrasena] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (usuario.trim().length < 3) {
      setLocalError("Ingresa un usuario valido.");
      return;
    }

    if (contrasena.trim().length < 6) {
      setLocalError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await login({ usuario: usuario.trim(), contrasena });
      navigate("/home");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Error en login");
    }
  };

  const handleRecuperarContrasena = async (e: FormEvent) => {
    e.preventDefault();
    setRecuperacionMensaje("");
    setRecuperacionError("");

    if (!correoRecuperacion.trim()) {
      setRecuperacionError("Ingresa el correo de tu cuenta.");
      return;
    }

    try {
      setRecuperandoContrasena(true);
      const response = await authService.recoverPassword(correoRecuperacion.trim());
      setRecuperacionMensaje(response.mensaje || "Te enviamos una contrasena temporal por correo.");
      setCorreoRecuperacion("");
    } catch (err) {
      setRecuperacionError(err instanceof Error ? err.message : "No se pudo recuperar la contrasena.");
    } finally {
      setRecuperandoContrasena(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header-left">
          <img src={logo} alt="RoomieGram" className="login-logo" onClick={() => navigate("/")} />
        </div>
        <button className="btn btn-outline-success" onClick={() => navigate("/register")}>Crear cuenta</button>
      </header>

      <div className="login-box">
        <div className="login-image"><img src={roomies} alt="Roomies" /></div>
        <div className="login-form">
          <h2>Iniciar sesion</h2>
          {(error || localError) && <div className="form-error">{error || localError}</div>}
          {!mostrarRecuperacion ? (
            <form onSubmit={handleSubmit}>
              <input className="form-control mb-3" placeholder="Usuario" type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={isLoading} />
              <input className="form-control mb-3" type="password" placeholder="Contrasena" value={contrasena} onChange={(e) => setContrasena(e.target.value)} disabled={isLoading} />
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setMostrarRecuperacion(true);
                  setRecuperacionMensaje("");
                  setRecuperacionError("");
                }}
                disabled={isLoading || recuperandoContrasena}
              >
                Olvidaste tu contrasena?
              </button>
              <button className="btn btn-success w-100 mb-3" type="submit" disabled={isLoading}>{isLoading ? "Cargando..." : "Ingresar"}</button>
            </form>
          ) : (
            <form onSubmit={handleRecuperarContrasena} className="login-recover-form">
              <h3 className="login-recover-title">Recuperar contrasena</h3>
              <input
                className="form-control mb-2"
                type="email"
                placeholder="Correo de tu cuenta"
                value={correoRecuperacion}
                onChange={(e) => setCorreoRecuperacion(e.target.value)}
                disabled={recuperandoContrasena || isLoading}
              />
              {recuperacionError && <div className="form-error">{recuperacionError}</div>}
              {recuperacionMensaje && <div className="form-success">{recuperacionMensaje}</div>}
              <button className="btn btn-outline-success w-100" type="submit" disabled={recuperandoContrasena || isLoading}>
                {recuperandoContrasena ? "Enviando..." : "Enviar contrasena temporal"}
              </button>
              <button
                type="button"
                className="login-forgot-link login-recover-back"
                onClick={() => {
                  setMostrarRecuperacion(false);
                  setRecuperacionMensaje("");
                  setRecuperacionError("");
                }}
                disabled={recuperandoContrasena || isLoading}
              >
                Volver al inicio de sesion
              </button>
            </form>
          )}
          <p className="login-legal">Al continuar aceptas nuestros terminos y condiciones.</p>
        </div>
      </div>
    </div>
  );
}
