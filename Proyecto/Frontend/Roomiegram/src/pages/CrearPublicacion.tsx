import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { useAuth } from "../context/AuthContext";
import { publicacionService } from "../services/publicacionService";
import type { PublicacionRequest } from "../types/Backend";
import type { Publicacion } from "../types/Publicacion";
import { saveLocalPublicacion } from "../utils/localPublicaciones";
import { savePublicacionImage } from "../utils/publicacionImages";

const initialPublicacionForm: PublicacionRequest = {
  usuarioCreador: "",
  titulo: "",
  ubicacion: "",
  descripcion: "",
  precio: 0,
  numeroHabitaciones: 1,
  numeroPersonas: 1,
  numeroBanos: 1,
};

export default function CrearPublicacion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<PublicacionRequest>(initialPublicacionForm);
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const validatePublicacion = () => {
    if (form.titulo.trim().length < 5) return "El titulo debe tener al menos 5 caracteres.";
    if (form.ubicacion.trim().length < 3) return "Ingresa una ubicacion valida.";
    if (form.descripcion.trim().length < 20) return "La descripcion debe tener al menos 20 caracteres.";
    if (Number(form.precio) <= 0) return "El precio debe ser mayor a cero.";
    if (Number(form.numeroHabitaciones) < 1 || Number(form.numeroPersonas) < 1 || Number(form.numeroBanos) < 1) return "Los detalles de la casa deben ser mayores a cero.";
    return "";
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setMessage("Sube imagenes validas para la publicacion.");
      return;
    }

    if (files.some((file) => file.size > 2 * 1024 * 1024)) {
      setMessage("Cada imagen debe pesar menos de 2 MB.");
      return;
    }

    Promise.all(
      files.slice(0, 6).map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.readAsDataURL(file);
          }),
      ),
    ).then((images) => {
      setImagenesPreview((current) => [...current, ...images.filter(Boolean)].slice(0, 6));
      setMessage("");
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const validationError = validatePublicacion();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const creador = form.usuarioCreador.trim() || user?.nombre || user?.usuario || "RoomieGram";
      const creada = await publicacionService.crear({
        ...form,
        usuarioCreador: creador,
        titulo: form.titulo.trim(),
        ubicacion: form.ubicacion.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        numeroHabitaciones: Number(form.numeroHabitaciones),
        numeroPersonas: Number(form.numeroPersonas),
        numeroBanos: Number(form.numeroBanos),
        imagen: imagenesPreview[0] || undefined,
        galeria: imagenesPreview.length > 0 ? imagenesPreview : undefined,
      });
      if (imagenesPreview[0]) savePublicacionImage(creada.id, imagenesPreview[0]);
      navigate("/home");
    } catch {
      const localPublicacion: Publicacion = {
        id: Date.now(),
        tipo: "ofrezco_casa",
        origen: "demo-local",
        nombre: user?.nombre || user?.usuario || "RoomieGram",
        titulo: form.titulo.trim(),
        precioMensual: Number(form.precio),
        precio: Number(form.precio),
        ubicacion: form.ubicacion.trim(),
        descripcion: form.descripcion.trim(),
        numeroHabitaciones: Number(form.numeroHabitaciones),
        numeroPersonas: Number(form.numeroPersonas),
        numeroBanos: Number(form.numeroBanos),
        amenidades: [`${form.numeroHabitaciones} habitacion(es)`, `${form.numeroPersonas} cupo(s)`, `${form.numeroBanos} bano(s)`],
        imagen: imagenesPreview[0] || home1,
        galeria: imagenesPreview.length > 0 ? imagenesPreview : [home1, home2, home3],
      };
      saveLocalPublicacion(localPublicacion);
      navigate("/home");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Cancelar</button>
        </div>
      </header>

      <section className="module-title">
        <h1>Crear publicacion</h1>
        <p>Publica una habitacion o casa disponible con fotos claras y datos utiles para futuros roomies.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="create-publication-shell">
        <form className="create-publication-form" onSubmit={handleSubmit}>
          <div className="create-section">
            <h3>Informacion principal</h3>
            <input className="form-control" placeholder="Titulo de la publicacion" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            <input className="form-control" placeholder="Ubicacion" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} required />
            <textarea className="form-control" placeholder="Describe el espacio, reglas basicas y ambiente del hogar" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
          </div>

          <div className="create-section">
            <h3>Detalles de la casa</h3>
            <p className="create-section-help">Estos datos aparecen en la ficha de la publicacion para que el roomie entienda rapido que se ofrece.</p>
            <div className="create-details-grid">
              <label className="field-label">
                <span>Precio mensual</span>
                <input className="form-control" placeholder="Ej: 280000" type="number" min="1" value={form.precio || ""} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
              </label>
              <label className="field-label">
                <span>Habitaciones del hogar</span>
                <input className="form-control" placeholder="Ej: 3" type="number" min="1" value={form.numeroHabitaciones} onChange={(e) => setForm({ ...form, numeroHabitaciones: Number(e.target.value) })} required />
              </label>
              <label className="field-label">
                <span>Cupos disponibles</span>
                <input className="form-control" placeholder="Ej: 1" type="number" min="1" value={form.numeroPersonas} onChange={(e) => setForm({ ...form, numeroPersonas: Number(e.target.value) })} required />
              </label>
              <label className="field-label">
                <span>Banos disponibles</span>
                <input className="form-control" placeholder="Ej: 2" type="number" min="1" value={form.numeroBanos} onChange={(e) => setForm({ ...form, numeroBanos: Number(e.target.value) })} required />
              </label>
            </div>
          </div>

          <div className="create-section">
            <h3>Fotos</h3>
            <label className="image-upload">
              <span>Agrega hasta 6 fotos</span>
              <input className="form-control" type="file" accept="image/*" multiple onChange={handleImageChange} />
            </label>
            {imagenesPreview.length > 0 && (
              <div className="image-preview gallery-preview">
                <div className="gallery-preview-grid">
                  {imagenesPreview.map((imagen, index) => (
                    <img src={imagen} alt={`Vista previa ${index + 1}`} key={`${imagen}-${index}`} />
                  ))}
                </div>
                <button type="button" className="btn btn-outline-success" onClick={() => setImagenesPreview([])}>Quitar fotos</button>
              </div>
            )}
          </div>

          <div className="create-actions">
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/mi-perfil")}>Volver a mi perfil</button>
            <button className="btn btn-success" disabled={isSaving}>{isSaving ? "Publicando..." : "Publicar"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
