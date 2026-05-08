import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import home2 from "../assets/home2.svg";
import home3 from "../assets/home3.svg";
import { useAuth } from "../context/AuthContext";
import { publicaciones as publicacionesDemo } from "../data/publicaciones";
import { publicacionService } from "../services/publicacionService";
import type { PublicacionRequest } from "../types/Backend";
import type { Publicacion } from "../types/Publicacion";

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

function mapBackendPublicacion(pub: Publicacion): Publicacion {
  return {
    id: pub.id,
    tipo: "ofrezco_casa",
    nombre: pub.usuarioCreador || "RoomieGram",
    titulo: pub.titulo || "Habitacion disponible",
    precioMensual: pub.precio || pub.precioMensual || 0,
    precio: pub.precio || pub.precioMensual || 0,
    ubicacion: pub.ubicacion,
    descripcion: pub.descripcion,
    amenidades: [
      `${pub.numeroHabitaciones || 1} habitacion(es)`,
      `${pub.numeroPersonas || 1} cupo(s)`,
      `${pub.numeroBanos || 1} bano(s)`,
    ],
    imagen: home1,
    galeria: [home1, home2, home3],
  };
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filtro, setFiltro] = useState<"busco_roomie" | "ofrezco_casa" | "todos">("todos");
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(publicacionesDemo);
  const [usaDatosBackend, setUsaDatosBackend] = useState(false);
  const [form, setForm] = useState<PublicacionRequest>(initialPublicacionForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiMessage, setApiMessage] = useState("");

  const loadPublicaciones = () => {
    let isMounted = true;
    setIsLoading(true);

    publicacionService
      .listar()
      .then((data) => {
        if (!isMounted) return;
        const mapped = data.map(mapBackendPublicacion);
        setPublicaciones(mapped.length > 0 ? mapped : publicacionesDemo);
        setUsaDatosBackend(mapped.length > 0);
        setApiMessage(mapped.length > 0 ? "" : "Mostrando datos demo porque no hay publicaciones registradas.");
      })
      .catch(() => {
        if (isMounted) {
          setPublicaciones(publicacionesDemo);
          setUsaDatosBackend(false);
          setApiMessage("Mostrando datos demo porque el servicio de publicaciones no esta disponible.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    return loadPublicaciones();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("crear") === "1") setShowCreateForm(true);
  }, [location.search]);

  const validatePublicacion = () => {
    if (form.titulo.trim().length < 5) return "El titulo debe tener al menos 5 caracteres.";
    if (form.ubicacion.trim().length < 3) return "Ingresa una ubicacion valida.";
    if (form.descripcion.trim().length < 20) return "La descripcion debe tener al menos 20 caracteres.";
    if (Number(form.precio) <= 0) return "El precio debe ser mayor a cero.";
    if (Number(form.numeroHabitaciones) < 1 || Number(form.numeroPersonas) < 1 || Number(form.numeroBanos) < 1) {
      return "Habitaciones, cupos y banos deben ser mayores a cero.";
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setApiMessage("");

    const validationError = validatePublicacion();
    if (validationError) {
      setApiMessage(validationError);
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
      });
      setPublicaciones((current) => [mapBackendPublicacion(creada), ...current.filter((pub) => pub.id !== creada.id)]);
      setUsaDatosBackend(true);
      setApiMessage("Publicacion creada correctamente.");
    } catch {
      setPublicaciones((current) => [
        {
          id: Date.now(),
          tipo: "ofrezco_casa",
          nombre: user?.nombre || user?.usuario || "Martina",
          titulo: form.titulo.trim(),
          precioMensual: Number(form.precio),
          precio: Number(form.precio),
          ubicacion: form.ubicacion.trim(),
          descripcion: form.descripcion.trim(),
          amenidades: [`${form.numeroHabitaciones} habitacion(es)`, `${form.numeroPersonas} cupo(s)`, `${form.numeroBanos} bano(s)`],
          imagen: home1,
          galeria: [home1, home2, home3],
        },
        ...current,
      ]);
      setApiMessage("Publicacion agregada en modo demo.");
    } finally {
      setForm(initialPublicacionForm);
      setShowCreateForm(false);
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setApiMessage("");
    try {
      await publicacionService.eliminar(id, user?.usuario || user?.nombre || "RoomieGram", user?.role || "CLIENTE");
      setApiMessage("Publicacion eliminada correctamente.");
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Publicacion eliminada en modo demo.");
    } finally {
      setPublicaciones((current) => current.filter((pub) => pub.id !== id));
    }
  };

  const publicacionesFiltradas = useMemo(() => {
    return filtro === "todos" ? publicaciones : publicaciones.filter((pub) => pub.tipo === filtro);
  }, [filtro, publicaciones]);

  return (
    <div className="home-page">
      <header className="home-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/")} />
        <div className="home-header-actions">
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/")}>Inicio</button>
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/mi-perfil")}>Perfil</button>
          <button className="btn btn-outline-success me-2" onClick={() => navigate("/compatibilidad")}>Buscar compatibilidad</button>
          <button className="btn btn-success" onClick={() => navigate("/dashboard")}>Admin</button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Conecta con tu roomie ideal</h1>
          <p>Busca personas que compartan tu espacio u ofrece tu casa o habitacion.</p>
        </div>
      </section>

      {showCreateForm && (
        <section className="module-layout single home-create">
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Nueva publicacion</h3>
            <input className="form-control" placeholder="Titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
            <input className="form-control" placeholder="Ubicacion" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} required />
            <textarea className="form-control" placeholder="Descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
            <div className="form-row">
              <input className="form-control" placeholder="Precio" type="number" min="1" value={form.precio || ""} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
              <input className="form-control" placeholder="Habitaciones" type="number" min="1" value={form.numeroHabitaciones} onChange={(e) => setForm({ ...form, numeroHabitaciones: Number(e.target.value) })} required />
            </div>
            <div className="form-row">
              <input className="form-control" placeholder="Cupos" type="number" min="1" value={form.numeroPersonas} onChange={(e) => setForm({ ...form, numeroPersonas: Number(e.target.value) })} required />
              <input className="form-control" placeholder="Banos" type="number" min="1" value={form.numeroBanos} onChange={(e) => setForm({ ...form, numeroBanos: Number(e.target.value) })} required />
            </div>
            <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar publicacion"}</button>
          </form>
        </section>
      )}

      <section className="home-filtros">
        <div className="filtros-container">
          <button className={`btn filtro-btn ${filtro === "todos" ? "filtro-activo" : ""}`} onClick={() => setFiltro("todos")}>Ver todos</button>
          <button className={`btn filtro-btn ${filtro === "busco_roomie" ? "filtro-activo" : ""}`} onClick={() => setFiltro("busco_roomie")}>Buscar roomie</button>
          <button className={`btn filtro-btn ${filtro === "ofrezco_casa" ? "filtro-activo" : ""}`} onClick={() => setFiltro("ofrezco_casa")}>Ofertar casa</button>
        </div>
      </section>

      {apiMessage && <p className="api-message">{apiMessage}</p>}

      <section className="home-publicaciones">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando publicaciones...</p></div>
        ) : publicacionesFiltradas.length === 0 ? (
          <div className="sin-resultados"><p>No hay publicaciones disponibles</p></div>
        ) : (
          publicacionesFiltradas.map((pub) => (
            <article className="home-card" key={pub.id}>
              {pub.tipo === "busco_roomie" ? (
                <>
                  {pub.imagen && <img src={pub.imagen} alt={pub.nombre} className="home-card-img" />}
                  <div className="home-card-body">
                    <div className="home-card-top">
                      <h3>{pub.nombre}{pub.edad ? `, ${pub.edad}` : ""}</h3>
                      <p className="home-ubicacion">Ubicacion: {pub.ubicacion}</p>
                    </div>
                    <p className="home-desc">{pub.descripcion}</p>
                    {pub.intereses && <div className="home-tags">{pub.intereses.map((tag) => <span key={tag} className="home-tag">{tag}</span>)}</div>}
                    <button className="btn btn-success w-100 mt-4" onClick={() => navigate(`/perfil/${pub.id}`)}>Ver perfil</button>
                  </div>
                </>
              ) : (
                <>
                  {pub.imagen && <img src={pub.imagen} alt={pub.titulo || pub.ubicacion} className="home-card-img" />}
                  <div className="home-card-body">
                    <div className="home-card-top">
                      <h3>{pub.titulo}</h3>
                      <p className="home-ubicacion">Ubicacion: {pub.ubicacion}</p>
                      <p className="home-precio">${pub.precioMensual?.toLocaleString("es-CL")} / mes</p>
                    </div>
                    <p className="home-desc-oferta"><strong>Ofrecido por:</strong> {pub.nombre}{pub.edad ? ` (${pub.edad} anos)` : ""}</p>
                    <p className="home-desc">{pub.descripcion}</p>
                    {pub.amenidades && <div className="home-tags">{pub.amenidades.map((amenidad) => <span key={amenidad} className="home-tag amenidad-tag">{amenidad}</span>)}</div>}
                    <button className="btn btn-outline-success w-100 mt-4" onClick={() => navigate(`/detalle-publicacion/${pub.id}`)}>Ver detalles</button>
                    {usaDatosBackend && <button className="btn btn-outline-danger w-100 mt-2" onClick={() => handleDelete(pub.id)}>Eliminar</button>}
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
