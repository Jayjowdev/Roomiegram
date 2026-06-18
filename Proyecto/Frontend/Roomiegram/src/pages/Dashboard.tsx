import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { publicacionService } from "../services/publicacionService";
import { tareaService } from "../services/tareaService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { Tarea } from "../types/Tarea";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";

type DashboardStats = {
  publicaciones: number;
  hogares: number;
  tareas: number;
  solicitudesPendientes: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    publicaciones: 0,
    hogares: 0,
    tareas: 0,
    solicitudesPendientes: 0,
  });
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [deletingPublicationId, setDeletingPublicationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardFilter, setDashboardFilter] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      publicacionService.listar(),
      hogarService.listar(),
      tareaService.listar(),
    ])
      .then(([publicacionesResult, hogaresResult, tareasResult]) => {
        if (!isMounted) return;

        const backendPublicaciones =
          publicacionesResult.status === "fulfilled" ? publicacionesResult.value : [];
        const localPublicaciones = getLocalPublicaciones()
          .filter((publicacion) => !isGeneratedProfile(publicacion))
          .map((publicacion) => ({ ...publicacion, origen: "local" as const }));
        const publicacionesData = [
          ...backendPublicaciones.map((publicacion) => ({ ...publicacion, origen: "backend" as const })),
          ...localPublicaciones,
        ];
        const hogaresData = hogaresResult.status === "fulfilled" ? hogaresResult.value : [];
        const tareasData = tareasResult.status === "fulfilled" ? tareasResult.value : [];
        const solicitudesPendientes = hogaresData.reduce(
          (total, hogar) => total + (hogar.solicitudesPendientesIds?.length ?? 0),
          0,
        );

        setStats({
          publicaciones: publicacionesData.length,
          hogares: hogaresData.length,
          tareas: tareasData.length,
          solicitudesPendientes,
        });
        setPublicaciones(publicacionesData);
        setHogares(hogaresData);
        setTareas(tareasData);

        if ([publicacionesResult, hogaresResult, tareasResult].some((result) => result.status === "rejected")) {
          setMessage("Algunos datos reales no se pudieron cargar. Intenta nuevamente.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const eliminarPublicacion = async (publicacion: Publicacion) => {
    if (!user?.usuario || user.role !== "ADMIN") {
      setMessage("Solo un administrador puede moderar publicaciones.");
      return;
    }

    const titulo = getPublicationTitle(publicacion);
    const confirmar = window.confirm(`Eliminar la publicacion "${titulo}"?`);
    if (!confirmar) return;

    setDeletingPublicationId(publicacion.id);
    setMessage("");

    try {
      if (publicacion.origen === "local") {
        deleteLocalPublicacion(publicacion.id);
      } else {
        await publicacionService.eliminar(publicacion.id, user.usuario, user.role);
      }

      setPublicaciones((current) =>
        current.filter((item) => !(item.id === publicacion.id && item.origen === publicacion.origen))
      );
      setStats((current) => ({
        ...current,
        publicaciones: Math.max(0, current.publicaciones - 1),
      }));
      setMessage("Publicacion eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la publicacion.");
    } finally {
      setDeletingPublicationId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-CL");
  };

  const getPublicationTitle = (publicacion: Publicacion) =>
    publicacion.titulo || publicacion.nombre || `${publicacion.usuarioCreador || "Usuario"} busca roomie`;

  const getPublicationPrice = (publicacion: Publicacion) => {
    const price = publicacion.precio ?? publicacion.precioMensual;
    return typeof price === "number" && price > 0 ? `$${price.toLocaleString("es-CL")}` : "Sin precio";
  };

  const normalizeSearch = (value: unknown) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const matchesFilter = (values: unknown[]) => {
    const filter = normalizeSearch(dashboardFilter);
    if (!filter) return true;
    return values.some((value) => normalizeSearch(value).includes(filter));
  };

  const publicacionesFiltradas = useMemo(
    () =>
      publicaciones.filter((publicacion) =>
        matchesFilter([
          getPublicationTitle(publicacion),
          publicacion.descripcion,
          publicacion.tipo || (publicacion.origen === "backend" ? "ofrezco_casa" : "Sin tipo"),
          publicacion.usuarioCreador,
          publicacion.nombre,
          publicacion.ubicacion,
          publicacion.origen,
          publicacion.correo,
          getPublicationPrice(publicacion),
        ]),
      ),
    [dashboardFilter, publicaciones],
  );

  const hogaresFiltrados = useMemo(
    () =>
      hogares.filter((hogar) =>
        matchesFilter([
          hogar.nombre,
          hogar.descripcion,
          hogar.activo ? "activo" : "inactivo",
          `creador ${hogar.usuarioCreadorId}`,
          `admin ${hogar.usuarioAdministradorId}`,
          `integrantes ${hogar.integrantesIds?.length ?? 0}`,
          `solicitudes ${hogar.solicitudesPendientesIds?.length ?? 0}`,
          `tareas ${hogar.tareasIds?.length ?? 0}`,
          formatDate(hogar.fechaCreacion),
        ]),
      ),
    [dashboardFilter, hogares],
  );

  const tareasFiltradas = useMemo(
    () =>
      tareas.filter((tarea) =>
        matchesFilter([
          tarea.titulo,
          tarea.descripcion,
          tarea.encargado,
          tarea.completada ? "completada" : "pendiente",
          formatDate(tarea.fecha),
        ]),
      ),
    [dashboardFilter, tareas],
  );

  const hasActiveFilter = dashboardFilter.trim().length > 0;
  const filteredTotal = publicacionesFiltradas.length + hogaresFiltrados.length + tareasFiltradas.length;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/convivencia")}>
            Panel convivencia
          </button>
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="dashboard-welcome">
        <h1>Dashboard de administracion</h1>
        <p>
          Hola, {user?.nombre || user?.usuario || "usuario"}. Revisa datos reales de RoomieGram y
          modera publicaciones registradas en la plataforma.
        </p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="dashboard-stats">
        <article className="dashboard-card">
          <h5>Total publicaciones</h5>
          <h2>{isLoading ? "..." : stats.publicaciones}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Total hogares</h5>
          <h2>{isLoading ? "..." : stats.hogares}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Tareas registradas</h5>
          <h2>{isLoading ? "..." : stats.tareas}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Solicitudes pendientes</h5>
          <h2>{isLoading ? "..." : stats.solicitudesPendientes}</h2>
        </article>
      </section>

      <section className="dashboard-filter-panel">
        <div>
          <label htmlFor="dashboard-filter">Buscar actividad</label>
          <p>Filtra publicaciones, hogares y tareas por usuario, titulo, descripcion, tipo, hogar, encargado o estado.</p>
        </div>
        <div className="dashboard-filter-controls">
          <input
            id="dashboard-filter"
            className="form-control"
            type="search"
            placeholder="Ej: franco, casa amoblada, pendiente, Santiago"
            value={dashboardFilter}
            onChange={(event) => setDashboardFilter(event.target.value)}
          />
          <button
            className="btn btn-outline-success"
            type="button"
            onClick={() => setDashboardFilter("")}
            disabled={!hasActiveFilter}
          >
            Limpiar
          </button>
        </div>
        <span className="dashboard-filter-summary">
          {hasActiveFilter
            ? `Mostrando ${filteredTotal} resultados para "${dashboardFilter.trim()}"`
            : `Mostrando ${stats.publicaciones + stats.hogares + stats.tareas} registros reales`}
        </span>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <h4>Publicaciones registradas</h4>
            <span className="status-pill">{publicacionesFiltradas.length} resultados</span>
          </div>
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando publicaciones...</p></div>
          ) : publicaciones.length === 0 ? (
            <div className="sin-resultados"><p>No hay publicaciones registradas.</p></div>
          ) : publicacionesFiltradas.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list">
              {publicacionesFiltradas.map((publicacion) => (
                <article className="module-item" key={`${publicacion.origen || "backend"}-${publicacion.id}`}>
                  <div className="section-heading-row">
                    <h4>{getPublicationTitle(publicacion)}</h4>
                    <span className="status-pill">{publicacion.usuarioCreador || "Sin creador"}</span>
                  </div>
                  <p>{publicacion.descripcion || "Sin descripcion"}</p>
                  <span>
                    {publicacion.tipo || (publicacion.origen === "backend" ? "ofrezco_casa" : "Sin tipo")} ·{" "}
                    {publicacion.ubicacion || "Sin ubicacion"} ·{" "}
                    {getPublicationPrice(publicacion)}
                  </span>
                  <div className="item-actions">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => eliminarPublicacion(publicacion)}
                      disabled={deletingPublicationId === publicacion.id}
                    >
                      {deletingPublicationId === publicacion.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-profile">
          <h4>Sesion administrativa</h4>
          <p><strong>Nombre:</strong> {user?.nombre || "No informado"}</p>
          <p><strong>Usuario:</strong> {user?.usuario || "No informado"}</p>
          <p><strong>Rol:</strong> {user?.role || "CLIENTE"}</p>
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Ver publicaciones
          </button>
        </div>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <h4>Hogares registrados</h4>
            <span className="status-pill">{hogaresFiltrados.length} resultados</span>
          </div>
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando hogares...</p></div>
          ) : hogares.length === 0 ? (
            <div className="sin-resultados"><p>No hay hogares registrados.</p></div>
          ) : hogaresFiltrados.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list">
              {hogaresFiltrados.map((hogar) => (
                <article className="module-item" key={hogar.id}>
                  <div className="section-heading-row">
                    <h4>{hogar.nombre}</h4>
                    <span className="status-pill">{hogar.activo ? "Activo" : "Inactivo"}</span>
                  </div>
                  <p>{hogar.descripcion || "Sin descripcion"}</p>
                  <span>
                    Integrantes: {hogar.integrantesIds?.length ?? 0} · Solicitudes:{" "}
                    {hogar.solicitudesPendientesIds?.length ?? 0} · Tareas asociadas:{" "}
                    {hogar.tareasIds?.length ?? 0}
                  </span>
                  <small>
                    Creador ID: {hogar.usuarioCreadorId ?? "No informado"} · Admin ID:{" "}
                    {hogar.usuarioAdministradorId ?? "No informado"} · Creado: {formatDate(hogar.fechaCreacion)}
                  </small>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-activity">
          <div className="section-heading-row">
            <h4>Tareas registradas</h4>
            <span className="status-pill">{tareasFiltradas.length} resultados</span>
          </div>
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando tareas...</p></div>
          ) : tareas.length === 0 ? (
            <div className="sin-resultados"><p>No hay tareas registradas.</p></div>
          ) : tareasFiltradas.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list">
              {tareasFiltradas.map((tarea) => (
                <article className="module-item" key={tarea.id}>
                  <div className="section-heading-row">
                    <h4>{tarea.titulo}</h4>
                    <span className="status-pill">{tarea.completada ? "Completada" : "Pendiente"}</span>
                  </div>
                  <p>{tarea.descripcion || "Sin descripcion"}</p>
                  <span>Encargado: {tarea.encargado || "Sin encargado"}</span>
                  <small>Fecha limite: {formatDate(tarea.fecha)}</small>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
