import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { notificacionService } from "../services/notificacionService";
import type { Notificacion } from "../types/Backend";

const initialForm: Notificacion = {
  usuarioEmisorId: 1,
  usuarioReceptorId: 1,
  hogarId: 1,
  tipo: "INVITACION_HOGAR",
  estado: "PENDIENTE",
  titulo: "",
  mensaje: "",
};

const notificacionesDemo: Notificacion[] = [
  { id: 1, usuarioEmisorId: 1, usuarioReceptorId: 2, hogarId: 1, tipo: "TAREA_HOGAR", estado: "PENDIENTE", titulo: "Turno de cocina", mensaje: "Hoy corresponde limpiar la cocina compartida.", fechaCreacion: "2026-04-27T10:00:00" },
  { id: 2, usuarioEmisorId: 2, usuarioReceptorId: 1, hogarId: 1, tipo: "CUENTA_HOGAR", estado: "LEIDA", titulo: "Internet disponible", mensaje: "La cuenta de internet ya fue registrada para el mes.", fechaCreacion: "2026-04-26T18:30:00" },
];

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("es-CL") : "Sin fecha";
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(notificacionesDemo);
  const [form, setForm] = useState<Notificacion>({ ...initialForm, usuarioEmisorId: user?.id || 1 });
  const [message, setMessage] = useState("Mostrando notificaciones demo.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    notificacionService
      .listar()
      .then((data) => {
        setNotificaciones(data.length ? data : notificacionesDemo);
        setMessage(data.length ? "" : "Mostrando notificaciones demo.");
      })
      .catch(() => setMessage("Mostrando notificaciones demo porque el servicio no esta disponible."));
  }, []);

  const validateForm = () => {
    if ((form.titulo || "").trim().length < 4) return "El titulo debe tener al menos 4 caracteres.";
    if ((form.mensaje || "").trim().length < 10) return "El mensaje debe tener al menos 10 caracteres.";
    if (Number(form.usuarioReceptorId) <= 0) return "Ingresa un receptor valido.";
    if (Number(form.hogarId) <= 0) return "Ingresa un hogar valido.";
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    const payload = {
      ...form,
      titulo: form.titulo?.trim(),
      mensaje: form.mensaje?.trim(),
      usuarioEmisorId: Number(form.usuarioEmisorId || user?.id || 1),
      usuarioReceptorId: Number(form.usuarioReceptorId),
      hogarId: Number(form.hogarId),
    };

    try {
      const creada = await notificacionService.crear(payload);
      setNotificaciones((current) => [creada, ...current]);
      setMessage("Notificacion creada correctamente.");
    } catch {
      setNotificaciones((current) => [{ ...payload, id: Date.now(), fechaCreacion: new Date().toISOString() }, ...current]);
      setMessage("Notificacion agregada en modo demo.");
    } finally {
      setForm({ ...initialForm, usuarioEmisorId: user?.id || 1 });
      setIsSaving(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/dashboard")}>Admin</button>
        </div>
      </header>

      <section className="module-title">
        <h1>Notificaciones</h1>
        <p>Revisa avisos, recordatorios y movimientos del hogar.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout">
        <form className="module-form" onSubmit={handleSubmit}>
          <h3>Nueva notificacion</h3>
          <input className="form-control" placeholder="Titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          <textarea className="form-control" placeholder="Mensaje" value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} required />
          <select className="form-control" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="INVITACION_HOGAR">Invitacion hogar</option>
            <option value="CUENTA_HOGAR">Cuenta hogar</option>
            <option value="TAREA_HOGAR">Tarea hogar</option>
          </select>
          <div className="form-row">
            <input className="form-control" placeholder="ID receptor" type="number" min="1" value={form.usuarioReceptorId} onChange={(e) => setForm({ ...form, usuarioReceptorId: Number(e.target.value) })} required />
            <input className="form-control" placeholder="ID hogar" type="number" min="1" value={form.hogarId} onChange={(e) => setForm({ ...form, hogarId: Number(e.target.value) })} required />
          </div>
          <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar notificacion"}</button>
        </form>

        <div className="module-list">
          <h3>Notificaciones registradas</h3>
          {notificaciones.map((notificacion) => (
            <article className="module-item" key={notificacion.id || notificacion.titulo}>
              <h4>{notificacion.titulo}</h4>
              <p>{notificacion.mensaje}</p>
              <span>{notificacion.tipo} - {notificacion.estado} - {formatDate(notificacion.fechaCreacion)}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
