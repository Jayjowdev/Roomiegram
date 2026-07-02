import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { usuarioService } from "../services/usuarioService";

export default function Soporte() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    asunto: "",
    correo: user?.correo || "",
    mensaje: "",
  });
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user?.correo) {
      setForm((current) => ({ ...current, correo: current.correo || user.correo || "" }));
    }
  }, [user?.correo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const asunto = form.asunto.trim();
    const correo = form.correo.trim();
    const mensaje = form.mensaje.trim();

    if (!asunto) {
      setMessage("Ingresa un asunto para el mensaje.");
      return;
    }
    if (!correo || !correo.includes("@")) {
      setMessage("Ingresa un correo de contacto válido.");
      return;
    }
    if (!mensaje) {
      setMessage("Escribe tu mensaje para soporte.");
      return;
    }
    if (mensaje.length < 20) {
      setMessage("El mensaje debe tener al menos 20 caracteres.");
      return;
    }

    try {
      setIsSending(true);
      const response = await usuarioService.enviarContactoSoporte({
        asunto,
        correo,
        mensaje,
        nombre: user?.nombre,
        usuario: user?.usuario,
      });

      setMessage(response.mensaje || "Mensaje enviado al equipo de soporte.");
      if (response.enviado) {
        setForm({ asunto: "", correo: user?.correo || correo, mensaje: "" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el mensaje de soporte.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="perfil-page support-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="support-layout">
        <div className="support-copy">
          <span className="demo-kicker">Soporte</span>
          <h1>Contacto con Roomiegram</h1>
          <p>
            Envía dudas sobre tu cuenta, publicaciones o convivencia. El equipo recibirá tu mensaje por correo.
          </p>
          <div className="support-note">
            <strong>Tip</strong>
            <span>Incluye contexto suficiente para que podamos ayudarte más rápido.</span>
          </div>
        </div>

        <form className="support-form-card" onSubmit={handleSubmit}>
          <h2>Enviar mensaje</h2>
          <input
            className="form-control"
            placeholder="Asunto"
            maxLength={100}
            value={form.asunto}
            onChange={(event) => setForm((current) => ({ ...current, asunto: event.target.value }))}
          />
          <input
            className="form-control"
            placeholder="Correo de contacto"
            type="email"
            value={form.correo}
            onChange={(event) => setForm((current) => ({ ...current, correo: event.target.value }))}
          />
          <textarea
            className="form-control"
            placeholder="Mensaje para soporte"
            maxLength={1000}
            rows={7}
            value={form.mensaje}
            onChange={(event) => setForm((current) => ({ ...current, mensaje: event.target.value }))}
          />
          <small>{form.mensaje.length}/1000 caracteres</small>
          {message && <p className="form-feedback">{message}</p>}
          <button className="btn btn-success" type="submit" disabled={isSending}>
            {isSending ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      </section>
    </div>
  );
}
