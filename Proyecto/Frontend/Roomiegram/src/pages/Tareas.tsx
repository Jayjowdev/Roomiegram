import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { tareaService } from "../services/tareaService";
import type { Tarea } from "../types/Backend";

const initialForm: Tarea = {
  titulo: "",
  encargado: "",
  descripcion: "",
  fecha: "",
};

const tareasDemo: Tarea[] = [
  { id: 1, titulo: "Limpieza cocina", encargado: "Sofia", descripcion: "Limpiar meson, cocina y sacar reciclaje.", fecha: "2026-04-29" },
  { id: 2, titulo: "Comprar utiles", encargado: "Camila", descripcion: "Reponer confort, detergente y bolsas.", fecha: "2026-04-30" },
  { id: 3, titulo: "Orden living", encargado: "Daniela", descripcion: "Ordenar espacio comun antes del fin de semana.", fecha: "2026-05-02" },
];

export default function Tareas() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState<Tarea[]>(tareasDemo);
  const [form, setForm] = useState<Tarea>(initialForm);
  const [message, setMessage] = useState("Mostrando tareas demo.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    tareaService
      .listar()
      .then((data) => {
        setTareas(data.length ? data : tareasDemo);
        setMessage(data.length ? "" : "Mostrando tareas demo.");
      })
      .catch(() => setMessage("Mostrando tareas demo porque el servicio no esta disponible."));
  }, []);

  const validateForm = () => {
    if ((form.titulo || "").trim().length < 4) return "El titulo debe tener al menos 4 caracteres.";
    if ((form.encargado || "").trim().length < 2) return "Ingresa un encargado valido.";
    if ((form.descripcion || "").trim().length < 10) return "La descripcion debe tener al menos 10 caracteres.";
    if (!form.fecha) return "Selecciona una fecha para la tarea.";
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

    try {
      const payload = {
        ...form,
        titulo: form.titulo?.trim(),
        encargado: form.encargado?.trim(),
        descripcion: form.descripcion?.trim(),
      };
      const creada = await tareaService.crear(payload);
      setTareas((current) => [...current, creada]);
      setMessage("Tarea creada correctamente.");
    } catch {
      setTareas((current) => [...current, { ...form, id: Date.now() }]);
      setMessage("Tarea agregada en modo demo.");
    } finally {
      setForm(initialForm);
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
        <h1>Gestion de tareas</h1>
        <p>Organiza responsabilidades domesticas con encargado y fecha.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout">
        <form className="module-form" onSubmit={handleSubmit}>
          <h3>Nueva tarea</h3>
          <input className="form-control" placeholder="Titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          <input className="form-control" placeholder="Encargado" value={form.encargado} onChange={(e) => setForm({ ...form, encargado: e.target.value })} required />
          <textarea className="form-control" placeholder="Descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
          <input className="form-control" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar tarea"}</button>
        </form>

        <div className="module-list">
          <h3>Tareas registradas</h3>
          {tareas.map((tarea) => (
            <article className="module-item" key={tarea.id || `${tarea.titulo}-${tarea.fecha}`}>
              <h4>{tarea.titulo}</h4>
              <p>{tarea.descripcion}</p>
              <span>{tarea.encargado} - {tarea.fecha}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
