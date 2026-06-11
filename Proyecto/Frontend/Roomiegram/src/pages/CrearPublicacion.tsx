import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { ImageCropper } from "../components/ImageCropper";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { publicacionService } from "../services/publicacionService";
import type { UserSession } from "../types/auth";
import type { PublicacionRequest } from "../types/Backend";
import type { Publicacion, TipoPublicacion } from "../types/Publicacion";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile, saveLocalPublicacion } from "../utils/localPublicaciones";
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

function normalizarTexto(valor?: string) {
  return valor?.trim().toLowerCase() || "";
}

function mapBackendPublicacion(pub: Publicacion): Publicacion {
  return {
    ...pub,
    tipo: "ofrezco_casa",
    origen: "backend",
    nombre: pub.nombre || pub.usuarioCreador || "RoomieGram",
    precioMensual: pub.precioMensual ?? pub.precio ?? 0,
    precio: pub.precio ?? pub.precioMensual ?? 0,
  };
}

function mapLocalPublicacion(pub: Publicacion): Publicacion {
  return {
    ...pub,
    origen: "local",
  };
}

function localPublicacionPerteneceAlUsuario(publicacion: Publicacion, user: UserSession | null) {
  const usuarioActual = normalizarTexto(user?.usuario);
  const creadorPublicacion = normalizarTexto(publicacion.usuarioCreador);

  if (!usuarioActual || creadorPublicacion !== usuarioActual) {
    return false;
  }

  const correoActual = normalizarTexto(user?.correo);
  const correoPublicacion = normalizarTexto(publicacion.correo);

  if (correoActual && correoPublicacion) {
    return correoActual === correoPublicacion;
  }

  const nombreActual = normalizarTexto(user?.nombre);
  const nombrePublicacion = normalizarTexto(publicacion.nombre);

  if (nombrePublicacion) {
    return nombrePublicacion === nombreActual || nombrePublicacion === usuarioActual;
  }

  return false;
}

function getLocalPublicacionesDelUsuario(user: UserSession | null) {
  return getLocalPublicaciones()
    .filter((publicacion) => !isGeneratedProfile(publicacion))
    .map(mapLocalPublicacion)
    .filter((publicacion) => localPublicacionPerteneceAlUsuario(publicacion, user));
}

function getTipoLabel(tipo?: TipoPublicacion) {
  return tipo === "busco_roomie" ? "Busca roomie" : "Ofrece casa";
}

function getPrecioLabel(publicacion: Publicacion) {
  const monto = publicacion.tipo === "busco_roomie"
    ? publicacion.presupuestoMaximo || publicacion.precio
    : publicacion.precioMensual || publicacion.precio;

  return `$${Number(monto || 0).toLocaleString("es-CL")}`;
}

export default function CrearPublicacion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<PublicacionRequest>(initialPublicacionForm);
  const [tipoPublicacion, setTipoPublicacion] = useState<TipoPublicacion>("ofrezco_casa");
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [cropSource, setCropSource] = useState("");
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPublicaciones, setIsLoadingPublicaciones] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPublicaciones(true);

    publicacionService
      .listar()
      .then((data) => {
        if (!isMounted) return;

        const locales = getLocalPublicacionesDelUsuario(user);
        const backend = data.map(mapBackendPublicacion);

        setPublicaciones([...locales, ...backend]);
      })
      .catch(() => {
        if (isMounted) {
          setPublicaciones(getLocalPublicacionesDelUsuario(user));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPublicaciones(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const misPublicaciones = useMemo(() => {
    const usuarioActual = normalizarTexto(user?.usuario);

    return publicaciones.filter((publicacion) => {
      const mismoUsuario = !!usuarioActual && normalizarTexto(publicacion.usuarioCreador) === usuarioActual;

      if (publicacion.origen === "local") {
        return localPublicacionPerteneceAlUsuario(publicacion, user);
      }

      const mismoId = !!user?.id && publicacion.usuarioId === user.id;
      return mismoId || mismoUsuario;
    });
  }, [publicaciones, user]);

  const validatePublicacion = () => {
    if (form.titulo.trim().length < 5) return "El titulo debe tener al menos 5 caracteres.";
    if (form.ubicacion.trim().length < 3) return "Ingresa una ubicacion valida.";
    if (form.descripcion.trim().length < 20) return "La descripcion debe tener al menos 20 caracteres.";
    if (Number(form.precio) <= 0) return "El precio debe ser mayor a cero.";
    if (tipoPublicacion === "busco_roomie") return "";
    if (Number(form.numeroHabitaciones) < 1 || Number(form.numeroPersonas) < 1 || Number(form.numeroBanos) < 1) return "Los detalles de la casa deben ser mayores a cero.";
    return "";
  };

  const guardarPublicacionLocal = (creador: string) => {
    const imagenPrincipal = imagenesPreview[0] || home1;
    const nuevaPublicacion: Publicacion = tipoPublicacion === "busco_roomie"
      ? {
          id: Date.now(),
          tipo: "busco_roomie",
          origen: "local",
          usuarioId: user?.id,
          usuarioCreador: creador,
          nombre: user?.nombre || user?.usuario || "RoomieGram",
          telefono: user?.telefono,
          correo: user?.correo,
          titulo: form.titulo.trim(),
          ubicacion: form.ubicacion.trim(),
          descripcion: form.descripcion.trim(),
          presupuestoMaximo: Number(form.precio),
          imagen: imagenPrincipal,
          galeria: imagenesPreview.length > 0 ? imagenesPreview : [home1, home2, home3],
        }
      : {
          id: Date.now(),
          tipo: "ofrezco_casa",
          origen: "local",
          usuarioId: user?.id,
          usuarioCreador: creador,
          nombre: user?.nombre || user?.usuario || "RoomieGram",
          telefono: user?.telefono,
          correo: user?.correo,
          titulo: form.titulo.trim(),
          precioMensual: Number(form.precio),
          precio: Number(form.precio),
          ubicacion: form.ubicacion.trim(),
          descripcion: form.descripcion.trim(),
          numeroHabitaciones: Number(form.numeroHabitaciones),
          numeroPersonas: Number(form.numeroPersonas),
          numeroBanos: Number(form.numeroBanos),
          amenidades: [`${form.numeroHabitaciones} habitacion(es)`, `${form.numeroPersonas} cupo(s)`, `${form.numeroBanos} bano(s)`],
          imagen: imagenPrincipal,
          galeria: imagenesPreview.length > 0 ? imagenesPreview : [home1, home2, home3],
        };

    saveLocalPublicacion(nuevaPublicacion);
  };

  const handleDelete = async (publicacion: Publicacion) => {
    if (!user?.usuario) {
      setMessage("No se pudo identificar el usuario autenticado.");
      return;
    }

    try {
      setDeletingId(publicacion.id);

      if (publicacion.origen === "backend") {
        await publicacionService.eliminar(publicacion.id, user.usuario, user.role || "CLIENTE");
      }

      deleteLocalPublicacion(publicacion.id);
      setPublicaciones((current) => current.filter((item) =>
        item.id !== publicacion.id || item.origen !== publicacion.origen
      ));
      setMessage("Publicacion eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la publicacion.");
    } finally {
      setDeletingId(null);
    }
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
      const validImages = images.filter(Boolean);
      setCropQueue(validImages.slice(1));
      setCropSource(validImages[0] || "");
      setMessage("");
    });
  };

  const saveCroppedPublicationImage = (image: string) => {
    setImagenesPreview((current) => [...current, image].slice(0, 6));
    const [nextImage, ...remainingImages] = cropQueue;
    setCropQueue(remainingImages);
    setCropSource(nextImage || "");
  };

  const cancelCrop = () => {
    const [nextImage, ...remainingImages] = cropQueue;
    setCropQueue(remainingImages);
    setCropSource(nextImage || "");
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
    const creador = user?.usuario?.trim() || form.usuarioCreador.trim() || "RoomieGram";
    const tituloPublicacion = form.titulo.trim();
    const ubicacionPublicacion = form.ubicacion.trim();
    const descripcionPublicacion = form.descripcion.trim();

    try {
      if (tipoPublicacion === "busco_roomie") {
        guardarPublicacionLocal(creador);
        navigate("/home");
        return;
      }

      if (!user?.id) {
        throw new Error("No se pudo identificar el usuario.");
      }

      const resultado = await publicacionService.crearConHogar({
        ...form,
        usuarioCreador: creador,
        titulo: tituloPublicacion,
        ubicacion: ubicacionPublicacion,
        descripcion: descripcionPublicacion,
        precio: Number(form.precio),
        numeroHabitaciones: Number(form.numeroHabitaciones),
        numeroPersonas: Number(form.numeroPersonas),
        numeroBanos: Number(form.numeroBanos),
        imagen: imagenesPreview[0] || undefined,
        galeria: imagenesPreview.length > 0 ? imagenesPreview : undefined,
        usuarioId: user.id,
      });

      if (imagenesPreview[0]) savePublicacionImage(resultado.publicacion.id, imagenesPreview[0]);
      navigate("/home");
    } catch (error) {
      if (tipoPublicacion === "ofrezco_casa") {
        setMessage(error instanceof Error ? error.message : "No se pudo crear la publicación y el hogar vinculado.");
        return;
      }

      guardarPublicacionLocal(creador);
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
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Crear publicacion</h1>
        <p>Elige si quieres publicar un hogar disponible o un perfil de usuario que busca hogar.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {cropSource && (
        <ImageCropper
          source={cropSource}
          title="Ajustar foto de publicacion"
          aspect={4 / 3}
          outputWidth={1200}
          outputHeight={900}
          onCancel={cancelCrop}
          onSave={saveCroppedPublicationImage}
        />
      )}

      <section className="create-publication-shell">
        <form className="create-publication-form" onSubmit={handleSubmit}>
          <div className="create-section">
            <h3>Tipo de publicacion</h3>
            <div className="d-grid gap-2 gap-md-3">
              <label className="form-check border rounded p-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipoPublicacion"
                  value="ofrezco_casa"
                  checked={tipoPublicacion === "ofrezco_casa"}
                  onChange={() => setTipoPublicacion("ofrezco_casa")}
                />
                <span className="ms-2 fw-semibold">Quiero publicar un hogar o habitacion disponible</span>
              </label>
              <label className="form-check border rounded p-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipoPublicacion"
                  value="busco_roomie"
                  checked={tipoPublicacion === "busco_roomie"}
                  onChange={() => setTipoPublicacion("busco_roomie")}
                />
                <span className="ms-2 fw-semibold">Quiero publicar un usuario que busca hogar</span>
              </label>
            </div>
            <p className="create-section-help">
              {tipoPublicacion === "ofrezco_casa"
                ? "Esta publicacion se enviara al servicio de publicaciones de hogares."
                : "Las publicaciones de usuarios que buscan hogar se guardan localmente en esta app por ahora."}
            </p>
          </div>

          <div className="create-section">
            <h3>Informacion principal</h3>
            <input className="form-control" placeholder={tipoPublicacion === "ofrezco_casa" ? "Titulo de la publicacion" : "Titulo de tu busqueda"} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            <input className="form-control" placeholder="Ubicacion" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} required />
            <textarea className="form-control" placeholder={tipoPublicacion === "ofrezco_casa" ? "Describe el espacio, reglas basicas y ambiente del hogar" : "Describe el tipo de hogar que buscas y como seria la convivencia ideal"} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
          </div>

          <div className="create-section">
            <h3>{tipoPublicacion === "ofrezco_casa" ? "Detalles de la casa" : "Preferencias de busqueda"}</h3>
            <p className="create-section-help">
              {tipoPublicacion === "ofrezco_casa"
                ? "Estos datos aparecen en la ficha de la publicacion para que el roomie entienda rapido que se ofrece."
                : "Comparte tu presupuesto para que otros usuarios sepan que tipo de hogar estas buscando."}
            </p>
            <div className="create-details-grid">
              <label className="field-label">
                <span>{tipoPublicacion === "ofrezco_casa" ? "Precio mensual" : "Presupuesto maximo"}</span>
                <input className="form-control" placeholder="Ej: 280000" type="number" min="1" value={form.precio || ""} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
              </label>
              {tipoPublicacion === "ofrezco_casa" && (
                <>
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
                </>
              )}
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

        <section className="create-section mt-4">
          <h3>Mis publicaciones</h3>
          <p className="create-section-help">
            Revisa rapidamente lo que publicaste y elimina lo que ya no quieras mostrar.
          </p>

          {isLoadingPublicaciones ? (
            <div className="sin-resultados"><p>Cargando tus publicaciones...</p></div>
          ) : misPublicaciones.length === 0 ? (
            <div className="sin-resultados"><p>Aun no tienes publicaciones creadas.</p></div>
          ) : (
            misPublicaciones.map((publicacion) => (
              <article className="module-item" key={`${publicacion.origen || "local"}-${publicacion.id}`}>
                <h4>{publicacion.titulo || "Publicacion sin titulo"}</h4>
                <p>{publicacion.descripcion}</p>
                <span>
                  {getTipoLabel(publicacion.tipo)} - {publicacion.ubicacion || "Ubicacion no informada"} - {getPrecioLabel(publicacion)}
                </span>
                <div className="item-actions">
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={() => navigate(publicacion.tipo === "busco_roomie" ? `/perfil/${publicacion.id}` : `/detalle-publicacion/${publicacion.id}`)}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={deletingId === publicacion.id}
                    onClick={() => handleDelete(publicacion)}
                  >
                    {deletingId === publicacion.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </div>
  );
}
