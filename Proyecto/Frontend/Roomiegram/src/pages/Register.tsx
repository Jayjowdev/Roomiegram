import { useRef, useState } from "react";
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
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [tipoCuenta, setTipoCuenta] = useState<"CLIENTE" | "COLABORADOR">("CLIENTE");

  const nombreRef = useRef<HTMLInputElement>(null);
  const correoRef = useRef<HTMLInputElement>(null);
  const usuarioRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const contrasenaRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const passwordRules = [
    { label: "Mínimo 8 caracteres", ok: contrasena.length >= 8 },
    { label: "Al menos una letra mayúscula", ok: /[A-Z]/.test(contrasena) },
    { label: "Al menos una letra minúscula", ok: /[a-z]/.test(contrasena) },
    { label: "Al menos un número", ok: /\d/.test(contrasena) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setLocalSuccess("");
    clearError();

    if (nombre.trim().length < 3) {
      setLocalError("Ingresa un nombre válido.");
      nombreRef.current?.focus();
      return;
    }

    if (!isValidEmail(correo)) {
      setLocalError("Ingresa un correo válido con dominio, por ejemplo nombre@correo.com.");
      correoRef.current?.focus();
      return;
    }

    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(usuario.trim())) {
      setLocalError("El usuario debe tener 3 a 20 caracteres y solo usar letras, números, punto, guion o guion bajo.");
      usuarioRef.current?.focus();
      return;
    }

    if (!isValidPhone(telefono)) {
      setLocalError("Ingresa un teléfono válido de 8 a 12 dígitos.");
      telefonoRef.current?.focus();
      return;
    }

    if (!isStrongPassword(contrasena)) {
      setLocalError("La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.");
      contrasenaRef.current?.focus();
      return;
    }

    if (contrasena !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      confirmPasswordRef.current?.focus();
      return;
    }

    try {
      const response = await register({
        nombre: nombre.trim(),
        correo: correo.trim(),
        usuario: usuario.trim(),
        telefono: telefono.trim(),
        contrasena,
        role: tipoCuenta,
      });

      if (response.requiereAprobacion) {
        setLocalSuccess(
          response.mensaje ||
            "Tu solicitud de colaborador fue enviada. Un administrador debe aprobarla antes de que puedas ingresar.",
        );
        setContrasena("");
        setConfirmPassword("");
        return;
      }

      navigate("/preferencias");
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
        {localSuccess && <div className="form-success">{localSuccess}</div>}

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          <label className="role-label" htmlFor="tipo-cuenta">Tipo de cuenta</label>
          <select
            id="tipo-cuenta"
            className="form-control"
            value={tipoCuenta}
            onChange={(e) => setTipoCuenta(e.target.value as "CLIENTE" | "COLABORADOR")}
            disabled={isLoading}
          >
            <option value="CLIENTE">Cliente</option>
            <option value="COLABORADOR">Colaborador</option>
          </select>
          {tipoCuenta === "COLABORADOR" && (
            <p className="role-info">
              Los colaboradores deben ser aprobados por un administrador antes de iniciar sesión.
            </p>
          )}

          <input ref={nombreRef} type="text" className="form-control" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isLoading} />
          <input ref={correoRef} type="email" className="form-control" placeholder="Correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={isLoading} />
          <input ref={usuarioRef} type="text" className="form-control" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={isLoading} />
          <input ref={telefonoRef} type="tel" className="form-control" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={isLoading} />
          <div className="password-input-group">
            <input
              ref={contrasenaRef}
              type={mostrarContrasena ? "text" : "password"}
              className="form-control"
              placeholder="Contraseña segura"
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
              aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
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
          <input ref={confirmPasswordRef} type={mostrarContrasena ? "text" : "password"} className="form-control" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />

          <button className="btn btn-success w-100 mt-3" type="submit" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="register-legal">Al registrarte aceptas nuestros términos y condiciones.</p>
        </form>
      </div>
    </div>
  );
}
