import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { getLocalPublicaciones, isGeneratedProfile, saveLocalPublicacion } from "../utils/localPublicaciones";
import { removePublicacionImage, savePublicacionImage } from "../utils/publicacionImages";
import { COMUNAS_SANTIAGO } from "../utils/ubicaciones";

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
  const tipo = pub.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa";

  return {
    ...pub,
    tipo,
    origen: "backend",
    nombre: pub.nombre || pub.usuarioCreador || "RoomieGram",
    precioMensual: tipo === "ofrezco_casa" ? pub.precioMensual ?? pub.precio ?? 0 : undefined,
    presupuestoMaximo: tipo === "busco_roomie" ? pub.presupuestoMaximo ?? pub.precio ?? 0 : undefined,
    precio: pub.precio ?? pub.precioMensual ?? 0,
  };
}

function mapLocalPublicacion(pub: Publicacion): Publicacion {
  return {
    ...pub,
    origen: "local",
  };
}

function buildEditableImages(publicacion: Publicacion) {
  return [...new Set([
    ...(publicacion.galeria || []),
    publicacion.imagen,
  ].filter((image): image is string => Boolean(image?.trim())))];
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

export default function CrearPublicacion() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [editingPublicacion, setEditingPublicacion] = useState<Publicacion | null>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const ubicacionRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);
  const habitacionesRef = useRef<HTMLInputElement>(null);
  const personasRef = useRef<HTMLInputElement>(null);
  const banosRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const editarId = searchParams.get("editar");
    if (!editarId || editingPublicacion || isLoadingPublicaciones) return;

    const origen = searchParams.get("origen");
    const publicacion = misPublicaciones.find((item) =>
      String(item.id) === editarId && (!origen || item.origen === origen),
    );

    if (publicacion) {
      startEditing(publicacion);
    }
  }, [editingPublicacion, isLoadingPublicaciones, misPublicaciones, searchParams]);

  function startEditing(publicacion: Publicacion) {
    const tipo = publicacion.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa";
    setEditingPublicacion(publicacion);
    setTipoPublicacion(tipo);
    setForm({
      usuarioCreador: publicacion.usuarioCreador || user?.usuario || "",
      titulo: publicacion.titulo || "",
      ubicacion: publicacion.ubicacion || "",
      descripcion: publicacion.descripcion || "",
      precio: Number(
        tipo === "busco_roomie"
          ? publicacion.presupuestoMaximo || publicacion.precio || 0
          : publicacion.precioMensual || publicacion.precio || 0,
      ),
      numeroHabitaciones: tipo === "ofrezco_casa" ? Number(publicacion.numeroHabitaciones || 1) : 0,
      numeroPersonas: tipo === "ofrezco_casa" ? Number(publicacion.numeroPersonas || 1) : 0,
      numeroBanos: tipo === "ofrezco_casa" ? Number(publicacion.numeroBanos || 1) : 0,
    });
    setImagenesPreview(buildEditableImages(publicacion));
    setMessage("Editando publicacion. Puedes mantener, agregar o eliminar fotos.");
    requestAnimationFrame(() => tituloRef.current?.focus());
  }

  function cancelEditing() {
    setEditingPublicacion(null);
    setTipoPublicacion("ofrezco_casa");
    setForm(initialPublicacionForm);
    setImagenesPreview([]);
    setCropQueue([]);
    setCropSource("");
    setMessage("");
    setSearchParams({});
  }

  const validatePublicacion = () => {
    if (form.titulo.trim().length < 5) {
      return { message: "El titulo debe tener al menos 5 caracteres.", ref: tituloRef };
    }
    if (form.ubicacion.trim().length < 3) {
      return { message: "Ingresa una ubicacion valida.", ref: ubicacionRef };
    }
    if (form.descripcion.trim().length < 20) {
      return { message: "La descripcion debe tener al menos 20 caracteres.", ref: descripcionRef };
    }
    if (Number(form.precio) <= 0) {
      return { message: "El precio debe ser mayor a cero.", ref: precioRef };
    }
    if (tipoPublicacion === "busco_roomie") return null;
    if (Number(form.numeroHabitaciones) < 1) {
      return { message: "Ingresa al menos una habitacion.", ref: habitacionesRef };
    }
    if (Number(form.numeroPersonas) < 1) {
      return { message: "Ingresa al menos un cupo disponible.", ref: personasRef };
    }
    if (Number(form.numeroBanos) < 1) {
      return { message: "Ingresa al menos un bano disponible.", ref: banosRef };
    }
    return null;
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
      event.currentTarget.value = "";
    });
  };

  const removePreviewImage = (indexToRemove: number) => {
    setImagenesPreview((current) => current.filter((_, index) => index !== indexToRemove));
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
      setMessage(validationError.message);
      validationError.ref.current?.focus();
      return;
    }

    setIsSaving(true);
    const creador = user?.usuario?.trim() || form.usuarioCreador.trim() || "RoomieGram";
    const tituloPublicacion = form.titulo.trim();
    const ubicacionPublicacion = form.ubicacion.trim();
    const descripcionPublicacion = form.descripcion.trim();
    const imagenesPublicacion = imagenesPreview.filter(Boolean);
    const payload = {
      tipo: tipoPublicacion,
      usuarioCreador: creador,
      titulo: tituloPublicacion,
      ubicacion: ubicacionPublicacion,
      descripcion: descripcionPublicacion,
      precio: Number(form.precio),
      numeroHabitaciones: tipoPublicacion === "ofrezco_casa" ? Number(form.numeroHabitaciones) : 0,
      numeroPersonas: tipoPublicacion === "ofrezco_casa" ? Number(form.numeroPersonas) : 0,
      numeroBanos: tipoPublicacion === "ofrezco_casa" ? Number(form.numeroBanos) : 0,
      imagen: imagenesPublicacion[0] || undefined,
      galeria: imagenesPublicacion,
    };

    try {
      if (editingPublicacion) {
        if (!user?.usuario) {
          throw new Error("No se pudo identificar el usuario autenticado.");
        }

        if (editingPublicacion.origen === "backend") {
          const actualizada = await publicacionService.actualizar(
            editingPublicacion.id,
            payload,
            user.usuario,
            user.role || "CLIENTE",
          );
          const mapped = mapBackendPublicacion(actualizada);
          if (imagenesPublicacion[0]) {
            savePublicacionImage(actualizada.id, imagenesPublicacion[0]);
          } else {
            removePublicacionImage(actualizada.id);
          }
          setPublicaciones((current) => current.map((item) =>
            item.id === editingPublicacion.id && item.origen === "backend" ? mapped : item
          ));
        } else {
          const actualizada: Publicacion = {
            ...editingPublicacion,
            ...payload,
            origen: "local",
            precioMensual: tipoPublicacion === "ofrezco_casa" ? Number(form.precio) : undefined,
            presupuestoMaximo: tipoPublicacion === "busco_roomie" ? Number(form.precio) : undefined,
            imagen: imagenesPublicacion[0] || undefined,
            galeria: imagenesPublicacion,
            amenidades: tipoPublicacion === "ofrezco_casa"
              ? [`${form.numeroHabitaciones} habitacion(es)`, `${form.numeroPersonas} cupo(s)`, `${form.numeroBanos} bano(s)`]
              : undefined,
          };
          saveLocalPublicacion(actualizada);
          setPublicaciones((current) => current.map((item) =>
            item.id === editingPublicacion.id && item.origen === "local" ? actualizada : item
          ));
        }

        setEditingPublicacion(null);
        setImagenesPreview([]);
        setSearchParams({});
        setMessage("Publicacion actualizada correctamente.");
        return;
      }

      if (tipoPublicacion === "busco_roomie") {
        const resultado = await publicacionService.crear({
          ...payload,
          imagen: imagenesPublicacion[0] || undefined,
          galeria: imagenesPublicacion.length > 0 ? imagenesPublicacion : undefined,
        });

        if (imagenesPublicacion[0]) savePublicacionImage(resultado.id, imagenesPublicacion[0]);
        navigate("/home");
        return;
      }

      if (!user?.id) {
        throw new Error("No se pudo identificar el usuario.");
      }

      const resultado = await publicacionService.crearConHogar({
        ...form,
        ...payload,
        imagen: imagenesPublicacion[0] || undefined,
        galeria: imagenesPublicacion.length > 0 ? imagenesPublicacion : undefined,
        usuarioId: user.id,
      });

      if (imagenesPublicacion[0]) savePublicacionImage(resultado.publicacion.id, imagenesPublicacion[0]);
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
        <h1>{editingPublicacion ? "Editar publicacion" : "Crear publicacion"}</h1>
        <p>
          {editingPublicacion
            ? "Corrige la informacion principal de tu publicacion. Las fotos actuales se mantienen."
            : "Elige si quieres publicar un hogar disponible o un perfil de usuario que busca hogar."}
        </p>
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
        <form className="create-publication-form" onSubmit={handleSubmit} noValidate>
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
                  disabled={Boolean(editingPublicacion)}
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
                  disabled={Boolean(editingPublicacion)}
                />
                <span className="ms-2 fw-semibold">Quiero publicar un usuario que busca hogar</span>
              </label>
            </div>
            <p className="create-section-help">
              {tipoPublicacion === "ofrezco_casa"
                ? "Esta publicacion se enviara al servicio de publicaciones de hogares."
                : "Esta publicacion se guardara en el servicio de publicaciones para que otros usuarios la vean."}
            </p>
          </div>

          <div className="create-section">
            <h3>Informacion principal</h3>
            <input ref={tituloRef} className="form-control" placeholder={tipoPublicacion === "ofrezco_casa" ? "Titulo de la publicacion" : "Titulo de tu busqueda"} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            <input
              ref={ubicacionRef}
              className="form-control"
              placeholder="Comuna o ubicacion"
              list="comunas-santiago"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              required
            />
            <datalist id="comunas-santiago">
              {COMUNAS_SANTIAGO.map((comuna) => (
                <option key={comuna} value={comuna} />
              ))}
            </datalist>
            <textarea ref={descripcionRef} className="form-control" placeholder={tipoPublicacion === "ofrezco_casa" ? "Describe el espacio, reglas basicas y ambiente del hogar" : "Describe el tipo de hogar que buscas y como seria la convivencia ideal"} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
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
                <input ref={precioRef} className="form-control" placeholder="Ej: 280000" type="number" min="1" value={form.precio || ""} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
              </label>
              {tipoPublicacion === "ofrezco_casa" && (
                <>
                  <label className="field-label">
                    <span>Habitaciones del hogar</span>
                    <input ref={habitacionesRef} className="form-control" placeholder="Ej: 3" type="number" min="1" value={form.numeroHabitaciones} onChange={(e) => setForm({ ...form, numeroHabitaciones: Number(e.target.value) })} required />
                  </label>
                  <label className="field-label">
                    <span>Cupos disponibles</span>
                    <input ref={personasRef} className="form-control" placeholder="Ej: 1" type="number" min="1" value={form.numeroPersonas} onChange={(e) => setForm({ ...form, numeroPersonas: Number(e.target.value) })} required />
                  </label>
                  <label className="field-label">
                    <span>Banos disponibles</span>
                    <input ref={banosRef} className="form-control" placeholder="Ej: 2" type="number" min="1" value={form.numeroBanos} onChange={(e) => setForm({ ...form, numeroBanos: Number(e.target.value) })} required />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="create-section">
              <h3>Fotos de la publicacion</h3>
              <label className="image-upload">
                <span>{editingPublicacion ? "Agregar fotos" : "Agrega hasta 6 fotos"}</span>
                <input className="form-control" type="file" accept="image/*" multiple onChange={handleImageChange} />
              </label>
              {imagenesPreview.length === 0 ? (
                <p className="form-helper">Esta publicacion no tiene fotos agregadas.</p>
              ) : (
                <div className="image-preview gallery-preview">
                  <div className="gallery-preview-grid">
                    {imagenesPreview.map((imagen, index) => (
                      <div className="gallery-preview-item" key={`${imagen}-${index}`}>
                        <img src={imagen} alt={`Vista previa ${index + 1}`} />
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removePreviewImage(index)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-outline-success" onClick={() => setImagenesPreview([])}>Quitar fotos</button>
                </div>
              )}
            </div>

          <div className="create-actions">
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/mi-perfil")}>Volver a mi perfil</button>
            {editingPublicacion && (
              <button className="btn btn-outline-success" type="button" onClick={cancelEditing}>
                Cancelar edicion
              </button>
            )}
            <button className="btn btn-success" disabled={isSaving}>
              {isSaving ? (editingPublicacion ? "Guardando..." : "Publicando...") : editingPublicacion ? "Guardar cambios" : "Publicar"}
            </button>
          </div>
        </form>

      </section>
    </div>
  );
}
