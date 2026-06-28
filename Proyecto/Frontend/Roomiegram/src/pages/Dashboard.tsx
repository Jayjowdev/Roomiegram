import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { publicacionService, type Historia } from "../services/publicacionService";
import { tareaService } from "../services/tareaService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { Tarea } from "../types/Tarea";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";

type DashboardStats = {
  publicaciones: number;
  historias: number;
  hogares: number;
  tareas: number;
  solicitudesPendientes: number;
};

type DashboardSection = "publicaciones" | "historias" | "hogares" | "tareas";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    publicaciones: 0,
    historias: 0,
    hogares: 0,
    tareas: 0,
    solicitudesPendientes: 0,
  });
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [deletingPublicationId, setDeletingPublicationId] = useState<number | null>(null);
  const [deletingHistoriaId, setDeletingHistoriaId] = useState<number | null>(null);
  const [editingHistoria, setEditingHistoria] = useState<Historia | null>(null);
  const [historiaForm, setHistoriaForm] = useState({ titulo: "", mensaje: "" });
  const [savingHistoria, setSavingHistoria] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardFilter, setDashboardFilter] = useState("");
  const [activeSection, setActiveSection] = useState<DashboardSection>("publicaciones");

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      publicacionService.listar(),
      publicacionService.listarHistorias(),
      hogarService.listar(),
      tareaService.listar(),
    ])
      .then(([publicacionesResult, historiasResult, hogaresResult, tareasResult]) => {
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
        const historiasData = historiasResult.status === "fulfilled" ? historiasResult.value : [];
        const hogaresData = hogaresResult.status === "fulfilled" ? hogaresResult.value : [];
        const tareasData = tareasResult.status === "fulfilled" ? tareasResult.value : [];
        const solicitudesPendientes = hogaresData.reduce(
          (total, hogar) => total + (hogar.solicitudesPendientesIds?.length ?? 0),
          0,
        );

        setStats({
          publicaciones: publicacionesData.length,
          historias: historiasData.length,
          hogares: hogaresData.length,
          tareas: tareasData.length,
          solicitudesPendientes,
        });
        setPublicaciones(publicacionesData);
        setHistorias(historiasData);
        setHogares(hogaresData);
        setTareas(tareasData);

        if ([publicacionesResult, historiasResult, hogaresResult, tareasResult].some((result) => result.status === "rejected")) {
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

  const startEditarHistoria = (historia: Historia) => {
    setEditingHistoria(historia);
    setHistoriaForm({
      titulo: historia.titulo,
      mensaje: historia.mensaje,
    });
    setMessage("Editando historia desde administracion.");
  };

  const cancelarEdicionHistoria = () => {
    setEditingHistoria(null);
    setHistoriaForm({ titulo: "", mensaje: "" });
    setMessage("");
  };

  const guardarHistoriaAdmin = async () => {
    if (!editingHistoria) return;
    if (!user?.usuario || user.role !== "ADMIN") {
      setMessage("Solo un administrador puede editar historias.");
      return;
    }

    const titulo = historiaForm.titulo.trim();
    const mensajeHistoria = historiaForm.mensaje.trim();

    if (!titulo) {
      setMessage("El titulo de la historia es obligatorio.");
      return;
    }
    if (mensajeHistoria.length < 20) {
      setMessage("La historia debe tener al menos 20 caracteres.");
      return;
    }
    if (mensajeHistoria.length > 500) {
      setMessage("La historia no puede superar 500 caracteres.");
      return;
    }

    try {
      setSavingHistoria(true);
      const actualizada = await publicacionService.actualizarHistoria(
        editingHistoria.id,
        {
          titulo,
          mensaje: mensajeHistoria,
          nombreVisible: editingHistoria.nombreVisible,
          usuarioCreador: editingHistoria.usuarioCreador,
        },
        user.usuario,
        user.role,
      );
      setHistorias((current) =>
        current.map((historia) => (historia.id === actualizada.id ? actualizada : historia))
      );
      setEditingHistoria(null);
      setHistoriaForm({ titulo: "", mensaje: "" });
      setMessage("Historia actualizada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la historia.");
    } finally {
      setSavingHistoria(false);
    }
  };

  const eliminarHistoriaAdmin = async (historia: Historia) => {
    if (!user?.usuario || user.role !== "ADMIN") {
      setMessage("Solo un administrador puede eliminar historias.");
      return;
    }

    const confirmar = window.confirm(`Eliminar la historia "${historia.titulo}"?`);
    if (!confirmar) return;

    try {
      setDeletingHistoriaId(historia.id);
      await publicacionService.eliminarHistoria(historia.id, user.usuario, user.role);
      setHistorias((current) => current.filter((item) => item.id !== historia.id));
      setStats((current) => ({
        ...current,
        historias: Math.max(0, current.historias - 1),
      }));
      if (editingHistoria?.id === historia.id) {
        cancelarEdicionHistoria();
      }
      setMessage("Historia eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la historia.");
    } finally {
      setDeletingHistoriaId(null);
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

  const resumirTexto = (value?: string, max = 150) => {
    const texto = value?.trim() || "Sin descripcion";
    return texto.length > max ? `${texto.slice(0, max).trim()}...` : texto;
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

  const historiasFiltradas = useMemo(
    () =>
      historias.filter((historia) =>
        matchesFilter([
          historia.titulo,
          historia.mensaje,
          historia.nombreVisible,
          historia.usuarioCreador,
          formatDate(historia.fechaCreacion),
          "historia",
        ]),
      ),
    [dashboardFilter, historias],
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
  const filteredTotal =
    publicacionesFiltradas.length + hogaresFiltrados.length + tareasFiltradas.length + historiasFiltradas.length;
  const totalRegistros = stats.publicaciones + stats.historias + stats.hogares + stats.tareas;
  const dashboardTabs = [
    { id: "publicaciones" as const, label: "Publicaciones", count: publicacionesFiltradas.length },
    { id: "historias" as const, label: "Historias", count: historiasFiltradas.length },
    { id: "hogares" as const, label: "Hogares", count: hogaresFiltrados.length },
    { id: "tareas" as const, label: "Tareas", count: tareasFiltradas.length },
  ];

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
          modera publicaciones e historias registradas en la plataforma.
        </p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="dashboard-stats">
        <article className="dashboard-card">
          <h5>Total publicaciones</h5>
          <h2>{isLoading ? "..." : stats.publicaciones}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Historias de usuarios</h5>
          <h2>{isLoading ? "..." : stats.historias}</h2>
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
          <p>
            Filtra publicaciones, historias, hogares y tareas por usuario, titulo, descripcion, tipo, hogar,
            encargado o estado.
          </p>
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
            : `Mostrando ${totalRegistros} registros reales`}
        </span>
      </section>

      <section className="dashboard-section-nav" aria-label="Secciones del dashboard">
        {dashboardTabs.map((tab) => (
          <button
            className={`dashboard-section-tab ${activeSection === tab.id ? "active" : ""}`}
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
          >
            <span>{tab.label}</span>
            <strong>{tab.count}</strong>
          </button>
        ))}
      </section>

      <section className={`dashboard-content dashboard-content-primary ${activeSection === "publicaciones" ? "" : "dashboard-hidden-section"}`}>
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
          <span className="demo-kicker">Sesion</span>
          <h4>Administrador activo</h4>
          <div className="admin-session-card">
            <strong>{user?.nombre || user?.usuario || "Administrador"}</strong>
            <span>{user?.usuario || "No informado"}</span>
            <span className="status-pill success">{user?.role || "CLIENTE"}</span>
          </div>
          <div className="admin-quick-actions">
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
              Ver Home
            </button>
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/historias")}>
              Ver historias
            </button>
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/convivencia")}>
              Panel convivencia
            </button>
          </div>
        </div>
      </section>

      <section className={`dashboard-content dashboard-content-wide ${activeSection === "historias" ? "" : "dashboard-hidden-section"}`}>
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <div>
              <h4>Historias de usuarios</h4>
              <p className="dashboard-section-help">Gestiona testimonios reales publicados por usuarios.</p>
            </div>
            <span className="status-pill">{historiasFiltradas.length} resultados</span>
          </div>

          {editingHistoria && (
            <div className="admin-inline-editor">
              <div>
                <label htmlFor="admin-historia-titulo">Titulo</label>
                <input
                  id="admin-historia-titulo"
                  className="form-control"
                  maxLength={80}
                  value={historiaForm.titulo}
                  onChange={(event) =>
                    setHistoriaForm((current) => ({ ...current, titulo: event.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="admin-historia-mensaje">Mensaje</label>
                <textarea
                  id="admin-historia-mensaje"
                  className="form-control"
                  rows={4}
                  maxLength={500}
                  value={historiaForm.mensaje}
                  onChange={(event) =>
                    setHistoriaForm((current) => ({ ...current, mensaje: event.target.value }))
                  }
                />
                <small>{historiaForm.mensaje.length}/500 caracteres</small>
              </div>
              <div className="item-actions">
                <button
                  className="btn btn-success btn-sm"
                  type="button"
                  onClick={guardarHistoriaAdmin}
                  disabled={savingHistoria}
                >
                  {savingHistoria ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  type="button"
                  onClick={cancelarEdicionHistoria}
                  disabled={savingHistoria}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="sin-resultados"><p>Cargando historias...</p></div>
          ) : historias.length === 0 ? (
            <div className="sin-resultados"><p>No hay historias registradas.</p></div>
          ) : historiasFiltradas.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list dashboard-history-list">
              {historiasFiltradas.map((historia) => (
                <article className="module-item dashboard-history-item" key={historia.id}>
                  <div className="section-heading-row">
                    <div>
                      <h4>{historia.titulo}</h4>
                      <span>{historia.nombreVisible || "Sin nombre visible"}</span>
                    </div>
                    <span className="status-pill">{historia.usuarioCreador || "Sin creador"}</span>
                  </div>
                  <p>{resumirTexto(historia.mensaje)}</p>
                  <small>Fecha: {formatDate(historia.fechaCreacion)}</small>
                  <div className="item-actions">
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => startEditarHistoria(historia)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => eliminarHistoriaAdmin(historia)}
                      disabled={deletingHistoriaId === historia.id}
                    >
                      {deletingHistoriaId === historia.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={`dashboard-content dashboard-single-switch ${activeSection === "hogares" || activeSection === "tareas" ? "" : "dashboard-hidden-section"}`}>
        <div className={`dashboard-activity ${activeSection === "hogares" ? "" : "dashboard-hidden-section"}`}>
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

        <div className={`dashboard-activity ${activeSection === "tareas" ? "" : "dashboard-hidden-section"}`}>
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
