import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { mapBackendPublicacionToOferta, publicacionService } from "../services/publicacionService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion, TipoPublicacion } from "../types/Publicacion";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";
import { getPublicacionImage } from "../utils/publicacionImages";

function normalizarTexto(valor?: string) {
  return valor
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") || "";
}

function publicacionPerteneceAlUsuario(publicacion: Publicacion, usuario?: string, correo?: string) {
  const usuarioActual = normalizarTexto(usuario);
  const correoActual = normalizarTexto(correo);
  const creador = normalizarTexto(publicacion.usuarioCreador);

  if (!usuarioActual || creador !== usuarioActual) return false;

  if (publicacion.origen === "local") {
    const correoPublicacion = normalizarTexto(publicacion.correo);
    return !correoActual || !correoPublicacion || correoActual === correoPublicacion;
  }

  return true;
}

function getTipoLabel(tipo?: TipoPublicacion) {
  return tipo === "busco_roomie" ? "Busco roomie" : "Ofrezco casa";
}

function getPrecioLabel(publicacion: Publicacion) {
  const monto = publicacion.tipo === "busco_roomie"
    ? publicacion.presupuestoMaximo || publicacion.precio
    : publicacion.precioMensual || publicacion.precio;

  if (!monto || Number(monto) <= 0) return publicacion.tipo === "busco_roomie" ? "Presupuesto no informado" : "Precio no informado";

  const label = `$${Number(monto).toLocaleString("es-CL")}`;
  return publicacion.tipo === "busco_roomie" ? `Presupuesto: ${label}` : `${label} / mes`;
}

function getTitulo(publicacion: Publicacion) {
  if (publicacion.titulo?.trim()) return publicacion.titulo;
  return publicacion.tipo === "busco_roomie" ? "Busco roomie" : "Habitacion disponible";
}

function getDescripcionResumen(publicacion: Publicacion) {
  const descripcion = publicacion.descripcion || "Sin descripcion";
  return descripcion.length > 150 ? `${descripcion.slice(0, 150).trim()}...` : descripcion;
}

type DeleteContext = {
  publicacion: Publicacion;
  hogar?: Hogar;
  puedeEliminarHogar: boolean;
  motivoBloqueo?: string;
};

export default function MisPublicaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [filtro, setFiltro] = useState<TipoPublicacion | "todas">("todas");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([publicacionService.listar(), hogarService.listar()])
      .then(([publicacionesResult, hogaresResult]) => {
        if (!isMounted) return;

        const data = publicacionesResult.status === "fulfilled" ? publicacionesResult.value : [];
        const backendPublicaciones = data
          .map((publicacion) => ({
            ...mapBackendPublicacionToOferta(publicacion),
            origen: "backend" as const,
            imagen: publicacion.imagen || getPublicacionImage(publicacion.id) || mapBackendPublicacionToOferta(publicacion).imagen,
          }))
          .filter((publicacion) => publicacionPerteneceAlUsuario(publicacion, user?.usuario, user?.correo));

        const localPublicaciones = getLocalPublicaciones()
          .filter((publicacion) => !isGeneratedProfile(publicacion))
          .map((publicacion) => ({ ...publicacion, origen: "local" as const }))
          .filter((publicacion) => publicacionPerteneceAlUsuario(publicacion, user?.usuario, user?.correo));

        setPublicaciones([...localPublicaciones, ...backendPublicaciones]);
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setMessage(publicacionesResult.status === "fulfilled" ? "" : "No se pudo cargar el servicio de publicaciones. Mostrando publicaciones locales si existen.");
      })
      .catch(() => {
        if (!isMounted) return;

        const locales = getLocalPublicaciones()
          .filter((publicacion) => !isGeneratedProfile(publicacion))
          .map((publicacion) => ({ ...publicacion, origen: "local" as const }))
          .filter((publicacion) => publicacionPerteneceAlUsuario(publicacion, user?.usuario, user?.correo));

        setPublicaciones(locales);
        setMessage("No se pudo cargar el servicio de publicaciones. Mostrando publicaciones locales si existen.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.correo, user?.usuario]);

  const publicacionesFiltradas = useMemo(() => {
    if (filtro === "todas") return publicaciones;
    return publicaciones.filter((publicacion) => publicacion.tipo === filtro);
  }, [filtro, publicaciones]);

  const getHogarVinculado = (publicacion: Publicacion) => {
    if (publicacion.tipo !== "ofrezco_casa" || publicacion.origen !== "backend") return undefined;
    return hogares.find((hogar) => hogar.publicacionIds?.includes(publicacion.id));
  };

  const evaluarEliminacionHogar = (hogar?: Hogar) => {
    if (!hogar || !user?.id) {
      return { puedeEliminarHogar: false, motivoBloqueo: undefined };
    }

    const esAdminDelHogar = hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id;
    const tieneIntegrantesExternos = (hogar.integrantesIds || []).some((usuarioId) =>
      usuarioId !== hogar.usuarioCreadorId && usuarioId !== hogar.usuarioAdministradorId,
    );
    const tieneActividad = Boolean(
      (hogar.solicitudesPendientesIds?.length ?? 0) > 0
      || (hogar.tareasIds?.length ?? 0) > 0
      || (hogar.hogarCuentaIds?.length ?? 0) > 0
      || (hogar.comprobanteIds?.length ?? 0) > 0
      || (hogar.publicacionIds?.length ?? 0) > 1
    );

    if (!esAdminDelHogar) {
      return { puedeEliminarHogar: false, motivoBloqueo: "Solo el administrador del hogar puede eliminar el hogar vinculado." };
    }

    if (tieneIntegrantesExternos || tieneActividad) {
      return {
        puedeEliminarHogar: false,
        motivoBloqueo: "Este hogar tiene actividad o integrantes. Por seguridad solo puedes eliminar la publicacion.",
      };
    }

    return { puedeEliminarHogar: true, motivoBloqueo: undefined };
  };

  const handleDelete = async (publicacion: Publicacion) => {
    if (!user?.usuario) {
      setMessage("No se pudo identificar tu sesion.");
      return;
    }

    const hogar = getHogarVinculado(publicacion);
    if (hogar) {
      const evaluacion = evaluarEliminacionHogar(hogar);
      setDeleteContext({
        publicacion,
        hogar,
        puedeEliminarHogar: evaluacion.puedeEliminarHogar,
        motivoBloqueo: evaluacion.motivoBloqueo,
      });
      return;
    }

    const confirmar = window.confirm(`Eliminar la publicacion "${getTitulo(publicacion)}"?`);
    if (!confirmar) return;

    await eliminarPublicacion(publicacion, "normal");
  };

  const eliminarPublicacion = async (publicacion: Publicacion, modo: "normal" | "mantener-hogar" | "con-hogar") => {
    if (!user?.usuario) {
      setMessage("No se pudo identificar tu sesion.");
      return;
    }

    try {
      setDeletingId(publicacion.id);

      if (publicacion.origen === "backend") {
        await publicacionService.eliminar(publicacion.id, user.usuario, user.role || "CLIENTE");
      } else {
        deleteLocalPublicacion(publicacion.id);
      }

      if (modo === "con-hogar") {
        const hogar = getHogarVinculado(publicacion);
        if (!hogar || !user.id) {
          throw new Error("No se pudo identificar el hogar vinculado.");
        }
        await hogarService.eliminar(hogar.id, user.id);
        setHogares((current) => current.filter((item) => item.id !== hogar.id));
      }

      setPublicaciones((current) => current.filter((item) =>
        !(item.id === publicacion.id && item.origen === publicacion.origen)
      ));
      setDeleteContext(null);
      setMessage(
        modo === "con-hogar"
          ? "Publicacion y hogar eliminados correctamente."
          : modo === "mantener-hogar"
            ? "Publicacion eliminada. El hogar vinculado se mantiene privado."
            : "Publicacion eliminada correctamente."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la publicacion.");
    } finally {
      setDeletingId(null);
    }
  };

  const verPublicacion = (publicacion: Publicacion) => {
    navigate(publicacion.tipo === "busco_roomie" ? `/perfil/${publicacion.id}` : `/detalle-publicacion/${publicacion.id}`);
  };

  const editarPublicacion = (publicacion: Publicacion) => {
    navigate(`/crear-publicacion?editar=${publicacion.id}&origen=${publicacion.origen || "backend"}`);
  };

  return (
    <div className="perfil-page">
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

      {message && <p className="api-message">{message}</p>}

      {deleteContext && (
        <div className="modal-backdrop-light" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Eliminar publicacion vinculada</h3>
            <p>
              Esta publicacion tiene un hogar vinculado. Si eliminas solo la publicacion, el hogar seguira existiendo como espacio privado de convivencia.
            </p>
            {!deleteContext.puedeEliminarHogar && deleteContext.motivoBloqueo && (
              <p className="form-helper">{deleteContext.motivoBloqueo}</p>
            )}
            <div className="item-actions">
              <button
                className="btn btn-outline-danger"
                type="button"
                disabled={deletingId === deleteContext.publicacion.id}
                onClick={() => eliminarPublicacion(deleteContext.publicacion, "mantener-hogar")}
              >
                Eliminar solo publicacion
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={!deleteContext.puedeEliminarHogar || deletingId === deleteContext.publicacion.id}
                onClick={() => eliminarPublicacion(deleteContext.publicacion, "con-hogar")}
              >
                Eliminar publicacion y hogar
              </button>
              <button className="btn btn-outline-success" type="button" onClick={() => setDeleteContext(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="my-publications-hero">
        <div>
          <span className="demo-kicker">Gestion personal</span>
          <h1>Mis publicaciones</h1>
          <p>Gestiona las publicaciones que has creado, edita la informacion y elimina las que ya no quieras mostrar.</p>
        </div>
        <button className="btn btn-success" onClick={() => navigate("/crear-publicacion")}>
          Crear publicacion
        </button>
      </section>

      <section className="my-publications-toolbar">
        <div className="filtros-container">
          <button className={`btn filtro-btn ${filtro === "todas" ? "filtro-activo" : ""}`} onClick={() => setFiltro("todas")}>
            Todas
          </button>
          <button className={`btn filtro-btn ${filtro === "ofrezco_casa" ? "filtro-activo" : ""}`} onClick={() => setFiltro("ofrezco_casa")}>
            Ofrezco casa
          </button>
          <button className={`btn filtro-btn ${filtro === "busco_roomie" ? "filtro-activo" : ""}`} onClick={() => setFiltro("busco_roomie")}>
            Busco roomie
          </button>
        </div>
        <p>{isLoading ? "Cargando publicaciones..." : `${publicacionesFiltradas.length} de ${publicaciones.length} publicaciones`}</p>
      </section>

      {isLoading ? (
        <div className="sin-resultados"><p>Cargando tus publicaciones...</p></div>
      ) : publicacionesFiltradas.length === 0 ? (
        <section className="my-publications-empty">
          <h2>No tienes publicaciones en esta vista</h2>
          <p>Crea una publicacion para ofrecer una habitacion o contar que estas buscando roomie.</p>
          <button className="btn btn-success" onClick={() => navigate("/crear-publicacion")}>
            Crear publicacion
          </button>
        </section>
      ) : (
        <section className="my-publications-grid">
          {publicacionesFiltradas.map((publicacion) => (
            <article className="my-publication-card" key={`${publicacion.origen || "backend"}-${publicacion.id}`}>
              {publicacion.imagen ? (
                <img src={publicacion.imagen} alt={getTitulo(publicacion)} className="my-publication-image" />
              ) : (
                <div className="my-publication-placeholder">
                  {publicacion.tipo === "busco_roomie" ? "Roomie" : "Hogar"}
                </div>
              )}
              <div className="my-publication-body">
                <div className="section-heading-row">
                  <h3>{getTitulo(publicacion)}</h3>
                  <span className="status-pill">{getTipoLabel(publicacion.tipo)}</span>
                </div>
                <p className="home-ubicacion">{publicacion.ubicacion || "Ubicacion no informada"}</p>
                <p className="home-precio">{getPrecioLabel(publicacion)}</p>
                <p className="home-desc">{getDescripcionResumen(publicacion)}</p>
                <div className="item-actions">
                  <button className="btn btn-outline-success btn-sm" type="button" onClick={() => verPublicacion(publicacion)}>
                    Ver
                  </button>
                  <button className="btn btn-outline-success btn-sm" type="button" onClick={() => editarPublicacion(publicacion)}>
                    Editar
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={deletingId === publicacion.id}
                    onClick={() => handleDelete(publicacion)}
                  >
                    {deletingId === publicacion.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
