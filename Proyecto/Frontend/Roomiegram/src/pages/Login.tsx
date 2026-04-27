import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import roomies from "../assets/login.png";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (usuario.trim().length < 3) {
      setLocalError("Ingresa un usuario válido.");
      return;
    }

    if (contrasena.trim().length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await login({ usuario: usuario.trim(), contrasena });
      navigate("/home");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Error en login");
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
          <h2>Iniciar sesión</h2>
          {(error || localError) && <div className="form-error">{error || localError}</div>}
          <form onSubmit={handleSubmit}>
            <input className="form-control mb-3" placeholder="Usuario" type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={isLoading} />
            <input className="form-control mb-3" type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} disabled={isLoading} />
            <button className="btn btn-success w-100 mb-3" type="submit" disabled={isLoading}>{isLoading ? "Cargando..." : "Ingresar"}</button>
          </form>
          <p className="login-legal">Al continuar aceptas nuestros términos y condiciones.</p>
        </div>
      </div>
    </div>
  );
}
