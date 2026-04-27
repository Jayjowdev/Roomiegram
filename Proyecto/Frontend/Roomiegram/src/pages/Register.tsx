import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";

function isValidEmail(value: string) {
  const email = value.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const domain = email.split("@")[1] || "";
  return emailPattern.test(email) && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 12;
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-ZÁÉÍÓÚÑ]/.test(value) && /[a-záéíóúñ]/.test(value) && /\d/.test(value);
}

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (nombre.trim().length < 3) {
      setLocalError("Ingresa un nombre válido.");
      return;
    }

    if (!isValidEmail(correo)) {
      setLocalError("Ingresa un correo válido con dominio, por ejemplo nombre@correo.com.");
      return;
    }

    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(usuario.trim())) {
      setLocalError("El usuario debe tener 3 a 20 caracteres y solo usar letras, números, punto, guion o guion bajo.");
      return;
    }

    if (!isValidPhone(telefono)) {
      setLocalError("Ingresa un teléfono válido de 8 a 12 dígitos.");
      return;
    }

    if (!isStrongPassword(contrasena)) {
      setLocalError("La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }

    if (contrasena !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    try {
      await register({ nombre: nombre.trim(), correo: correo.trim(), usuario: usuario.trim(), telefono: telefono.trim(), contrasena });
      navigate("/home");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Error en registro");
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <div className="register-header-left">
          <img src={logo} alt="RoomieGram" className="register-logo" onClick={() => navigate("/")} />
        </div>

        <button className="btn btn-outline-success" onClick={() => navigate("/login")}>
          Ya tengo cuenta
        </button>
      </header>

      <div className="register-box">
        <h2>Crear cuenta</h2>
        {(error || localError) && <div className="form-error">{error || localError}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <input type="text" className="form-control" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isLoading} />
          <input type="email" className="form-control" placeholder="Correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={isLoading} />
          <input type="text" className="form-control" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={isLoading} />
          <input type="tel" className="form-control" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={isLoading} />
          <input type="password" className="form-control" placeholder="Contraseña segura" value={contrasena} onChange={(e) => setContrasena(e.target.value)} disabled={isLoading} />
          <input type="password" className="form-control" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />

          <button className="btn btn-success w-100 mt-3" type="submit" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="register-legal">Al registrarte aceptas nuestros términos y condiciones.</p>
        </form>
      </div>
    </div>
  );
}
