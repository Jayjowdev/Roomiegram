import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import home1 from "../assets/home1.svg";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { publicacionService } from "../services/publicacionService";
import type { Publicacion, TipoPublicacion } from "../types/Publicacion";
import { getPublicacionImage } from "../utils/publicacionImages";

type FiltroColaborador = "todos" | "activas" | "ocultas" | TipoPublicacion;

function normalizarTexto(valor?: string) {
  return valor
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") || "";
}

function tipoLabel(tipo?: TipoPublicacion) {
  return tipo === "busco_roomie" ? "Busco roomie" : "Casa disponible";
}

function estadoModeracion(pub: Publicacion) {
  return pub.estadoModeracion === "OCULTA_MODERACION" ? "OCULTA_MODERACION" : "ACTIVA";
}

function mapPublicacionModeracion(pub: Publicacion): Publicacion {
  const tipo = pub.tipo === "busco_roomie" ? "busco_roomie" : "ofrezco_casa";
  const imagenGuardada = getPublicacionImage(pub.id);

  return {
    ...pub,
    tipo,
    origen: "backend",
    nombre: pub.nombre || pub.usuarioCreador || "Usuario Roomiegram",
    titulo: pub.titulo || (tipo === "busco_roomie" ? "Persona buscando roomie" : "Casa disponible"),
    precio: pub.precio ?? pub.precioMensual ?? pub.presupuestoMaximo ?? 0,
    precioMensual: tipo === "ofrezco_casa" ? (pub.precioMensual ?? pub.precio ?? 0) : undefined,
    presupuestoMaximo: tipo === "busco_roomie" ? (pub.presupuestoMaximo ?? pub.precio ?? 0) : undefined,
    imagen: pub.imagen || imagenGuardada || home1,
    estadoModeracion: pub.estadoModeracion || "ACTIVA",
  };
}

export default function ColaboradorPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [filtro, setFiltro] = useState<FiltroColaborador>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setMessage("");

    publicacionService
      .listarModeracion()
      .then((data) => {
        if (!isMounted) return;
        setPublicaciones(data.map(mapPublicacionModeracion));
      })
      .catch((error) => {
        if (!isMounted) return;
        setMessage(error instanceof Error ? error.message : "No se pudieron cargar las publicaciones.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const recargarPublicaciones = async () => {
    const data = await publicacionService.listarModeracion();
    setPublicaciones(data.map(mapPublicacionModeracion));
  };

  const publicacionesFiltradas = useMemo(() => {
    const query = normalizarTexto(busqueda);

    return publicaciones.filter((pub) => {
      const estado = estadoModeracion(pub);
      const coincideFiltro = filtro === "todos"
        || pub.tipo === filtro
        || (filtro === "activas" && estado === "ACTIVA")
        || (filtro === "ocultas" && estado === "OCULTA_MODERACION");
      const texto = normalizarTexto([
        pub.titulo,
        pub.descripcion,
        pub.ubicacion,
        pub.usuarioCreador,
        pub.nombre,
        tipoLabel(pub.tipo),
        estado === "OCULTA_MODERACION" ? "oculta moderacion" : "activa",
        pub.motivoModeracion,
      ].filter(Boolean).join(" "));

      return coincideFiltro && (!query || texto.includes(query));
    });
  }, [busqueda, filtro, publicaciones]);

  const totalCasa = publicaciones.filter((pub) => pub.tipo !== "busco_roomie").length;
  const totalRoomie = publicaciones.filter((pub) => pub.tipo === "busco_roomie").length;
  const totalActivas = publicaciones.filter((pub) => estadoModeracion(pub) === "ACTIVA").length;
  const totalOcultas = publicaciones.filter((pub) => estadoModeracion(pub) === "OCULTA_MODERACION").length;

  const handleOcultar = async (pub: Publicacion) => {
    if (!user?.id) {
      setMessage("No se pudo identificar al moderador.");
      return;
    }

    const motivo = window.prompt("Indica el motivo para ocultar esta publicacion:");
    const motivoLimpio = motivo?.trim() || "";
    if (!motivoLimpio) {
      setMessage("Debes indicar un motivo para ocultar la publicacion.");
      return;
    }

    const confirmar = window.confirm("Esta accion ocultara la publicacion de Home y listados normales. Deseas continuar?");
    if (!confirmar) return;

    try {
      setMessage("");
      await publicacionService.ocultar(pub.id, { moderadorId: user.id, motivo: motivoLimpio });
      await recargarPublicaciones();
      setMessage("Publicacion ocultada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo ocultar la publicacion. Intenta nuevamente.");
    }
  };

  return (
    <div className="dashboard-page collaborator-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
          <span className="dashboard-brand">RoomieGram</span>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          {user?.role === "ADMIN" && (
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/dashboard")}>
              Dashboard admin
            </button>
          )}
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="collaborator-hero">
        <div>
          <span className="status-pill success">{user?.role || "COLABORADOR"}</span>
          <h1>Panel de moderacion</h1>
          <p>Revisa publicaciones y oculta contenido que incumpla las normas de la comunidad.</p>
        </div>
        <div className="collaborator-scope-card">
          <strong>Permisos limitados</strong>
          <span>Este panel permite ocultar publicaciones problemáticas sin eliminar datos. Las acciones administrativas avanzadas siguen reservadas para ADMIN.</span>
        </div>
      </section>

      <section className="dashboard-stats collaborator-stats" aria-label="Resumen de publicaciones">
        <article className="dashboard-card">
          <h5>Revisables</h5>
          <h2>{publicaciones.length}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Activas</h5>
          <h2>{totalActivas}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Ocultas</h5>
          <h2>{totalOcultas}</h2>
        </article>
      </section>

      <section className="dashboard-filter-panel collaborator-filter-panel">
        <div>
          <label htmlFor="collaborator-search">Buscar publicaciones</label>
          <p>Busca por titulo, ubicacion, usuario o tipo.</p>
        </div>
        <div className="dashboard-filter-controls">
          <input
            id="collaborator-search"
            className="form-control"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Ej: Santiago, roomie, casa..."
          />
          <button
            className="btn btn-outline-success"
            type="button"
            onClick={() => {
              setBusqueda("");
              setFiltro("todos");
            }}
            disabled={!busqueda && filtro === "todos"}
          >
            Limpiar
          </button>
        </div>
        <strong className="dashboard-filter-summary">
          {isLoading ? "Cargando..." : `${publicacionesFiltradas.length} de ${publicaciones.length} publicaciones`}
        </strong>
      </section>

      <nav className="collaborator-tabs" aria-label="Filtros de publicaciones">
        {([
          ["todos", "Todas"],
          ["activas", "Activas"],
          ["ocultas", "Ocultas"],
          ["ofrezco_casa", "Casa disponible"],
          ["busco_roomie", "Busco roomie"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`dashboard-section-tab ${filtro === value ? "active" : ""}`}
            onClick={() => setFiltro(value)}
          >
            <span>{label}</span>
            <strong>
              {value === "todos"
                ? publicaciones.length
                : value === "activas"
                  ? totalActivas
                  : value === "ocultas"
                    ? totalOcultas
                    : value === "ofrezco_casa"
                      ? totalCasa
                      : totalRoomie}
            </strong>
          </button>
        ))}
      </nav>

      {message && <p className="api-message">{message}</p>}

      <section className="collaborator-publication-list" aria-label="Publicaciones para revision">
        {isLoading ? (
          <div className="sin-resultados"><p>Cargando publicaciones...</p></div>
        ) : publicacionesFiltradas.length === 0 ? (
          <div className="sin-resultados"><p>No hay publicaciones para este filtro.</p></div>
        ) : (
          publicacionesFiltradas.map((pub) => (
            <article className="collaborator-publication-row" key={pub.id}>
              <img src={pub.imagen || home1} alt={pub.titulo || "Publicacion"} />
              <div className="collaborator-publication-main">
                <div className="collaborator-publication-title">
                  <div>
                    <div className="collaborator-status-row">
                      <span className="status-pill">{tipoLabel(pub.tipo)}</span>
                      <span className={`status-pill ${estadoModeracion(pub) === "OCULTA_MODERACION" ? "warning" : "success"}`}>
                        {estadoModeracion(pub) === "OCULTA_MODERACION" ? "Oculta por moderacion" : "Activa"}
                      </span>
                    </div>
                    <h3>{pub.titulo}</h3>
                  </div>
                  <small>#{pub.id}</small>
                </div>
                <p>{pub.descripcion || "Sin descripcion informada."}</p>
                {estadoModeracion(pub) === "OCULTA_MODERACION" && (
                  <div className="collaborator-moderation-note">
                    <strong>Motivo:</strong> {pub.motivoModeracion || "No informado"}
                    {pub.fechaModeracion && <span>Fecha: {new Date(pub.fechaModeracion).toLocaleString("es-CL")}</span>}
                  </div>
                )}
                <div className="collaborator-publication-meta">
                  <span><strong>Ubicacion:</strong> {pub.ubicacion || "No informada"}</span>
                  <span><strong>Autor:</strong> {pub.usuarioCreador || pub.nombre || "No informado"}</span>
                  <span><strong>Telefono:</strong> {pub.telefono || "Telefono no informado"}</span>
                  {pub.precio ? (
                    <span>
                      <strong>{pub.tipo === "busco_roomie" ? "Presupuesto:" : "Precio:"}</strong>{" "}
                      ${pub.precio.toLocaleString("es-CL")}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="collaborator-publication-actions">
                {estadoModeracion(pub) === "ACTIVA" && (
                  <button className="btn btn-outline-success" type="button" onClick={() => navigate(`/detalle-publicacion/${pub.id}`)}>
                    Ver detalle
                  </button>
                )}
                {pub.usuarioId && (
                  <button className="btn btn-outline-success" type="button" onClick={() => navigate(`/perfil-publico/${pub.usuarioId}`)}>
                    Ver perfil
                  </button>
                )}
                {estadoModeracion(pub) === "ACTIVA" && (
                  <button className="btn btn-outline-danger" type="button" onClick={() => handleOcultar(pub)}>
                    Ocultar publicacion
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
