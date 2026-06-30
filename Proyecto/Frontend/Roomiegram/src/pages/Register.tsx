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
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
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
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [localError, setLocalError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [role, setRole] = useState<"CLIENTE" | "COLABORADOR" | "">("");

  const confirmacionIniciada = confirmPassword.length > 0;
  const contrasenasCoinciden = confirmacionIniciada && contrasena === confirmPassword;
  const contrasenasNoCoinciden = confirmacionIniciada && contrasena !== confirmPassword;

  const passwordRules = [
    { label: "Minimo 8 caracteres", ok: contrasena.length >= 8 },
    { label: "Al menos una letra mayuscula", ok: /[A-Z]/.test(contrasena) },
    { label: "Al menos una letra minuscula", ok: /[a-z]/.test(contrasena) },
    { label: "Al menos un numero", ok: /\d/.test(contrasena) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (role !== "CLIENTE" && role !== "COLABORADOR") {
      setLocalError("Selecciona si te registras como usuario-cliente o colaborador.");
      return;
    }

    if (nombre.trim().length < 3) {
      setLocalError("Ingresa un nombre valido.");
      return;
    }

    if (!isValidEmail(correo)) {
      setLocalError("Ingresa un correo valido con dominio, por ejemplo nombre@correo.com.");
      return;
    }

    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(usuario.trim())) {
      setLocalError("El usuario debe tener 3 a 20 caracteres y solo usar letras, numeros, punto, guion o guion bajo.");
      return;
    }

    if (!isValidPhone(telefono)) {
      setLocalError("Ingresa un telefono valido de 8 a 12 digitos.");
      return;
    }

    if (!isStrongPassword(contrasena)) {
      setLocalError("La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula y un numero.");
      return;
    }

    if (contrasena !== confirmPassword) {
      setLocalError("Las contrasenas no coinciden.");
      return;
    }

    try {
      await register({ nombre: nombre.trim(), correo: correo.trim(), usuario: usuario.trim(), telefono: telefono.trim(), contrasena, role });
      navigate(role === "COLABORADOR" ? "/login" : "/preferencias");
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
          <label className="role-label" htmlFor="role">Tipo de cuenta</label>
          <select
            id="role"
            className="form-control"
            value={role}
            onChange={(e) => setRole(e.target.value as "CLIENTE" | "COLABORADOR" | "")}
            disabled={isLoading}
            required
          >
            <option value="">Selecciona una opcion</option>
            <option value="CLIENTE">Usuario-cliente</option>
            <option value="COLABORADOR">Colaborador (moderador)</option>
          </select>

          {role === "COLABORADOR" && (
            <p className="role-info">
              Los colaboradores pueden moderar publicaciones y usuarios. Tu solicitud debe ser aprobada por un administrador antes de poder iniciar sesion.
            </p>
          )}

          <input type="text" className="form-control" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isLoading} />
          <input type="email" className="form-control" placeholder="Correo electronico" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={isLoading} />
          <input type="text" className="form-control" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={isLoading} />
          <input type="tel" className="form-control" placeholder="Telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={isLoading} />
          <div className="password-input-group">
            <input
              type={mostrarContrasena ? "text" : "password"}
              className="form-control"
              placeholder="Contrasena segura"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarContrasena((valorActual) => !valorActual)}
              disabled={isLoading}
              aria-label={mostrarContrasena ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {mostrarContrasena ? "Ocultar" : "Ver"}
            </button>
          </div>

          {(passwordFocused || contrasena.length > 0) && (
            <ul className="password-hints">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.ok ? "hint-ok" : "hint-pending"}>
                  {rule.ok ? "OK" : "-"} {rule.label}
                </li>
              ))}
            </ul>
          )}
          <div className="password-input-group">
            <input
              type={mostrarConfirmacion ? "text" : "password"}
              className="form-control"
              placeholder="Confirmar contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarConfirmacion((valorActual) => !valorActual)}
              disabled={isLoading}
              aria-label={mostrarConfirmacion ? "Ocultar confirmacion de contrasena" : "Mostrar confirmacion de contrasena"}
            >
              {mostrarConfirmacion ? "Ocultar" : "Ver"}
            </button>
          </div>

          {contrasenasNoCoinciden && <p className="form-error">Las contrasenas no coinciden.</p>}
          {contrasenasCoinciden && <p className="form-success">Las contrasenas coinciden.</p>}

          <button className="btn btn-success w-100 mt-3" type="submit" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="register-legal">Al registrarte aceptas nuestros terminos y condiciones.</p>
        </form>
      </div>
    </div>
  );
}
