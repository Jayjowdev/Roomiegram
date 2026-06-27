import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import avatarUser from "../assets/avatarUser.svg";
import { ImageCropper } from "../components/ImageCropper";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { membresiaService, PLAN_BADGE_CLASS, PLAN_LABELS, type PlanId, type Suscripcion } from "../services/membresiaService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";
import { getPreferenciasResumen } from "../utils/preferenciasCompatibilidad";

function uniqueIds(ids: Array<number | undefined>) {
  return [...new Set(ids.filter((id): id is number => typeof id === "number" && id > 0))];
}

function getMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string },
) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tu";

  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || "Integrante del hogar";
}

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

function getTipoPublicacionLabel(publicacion: Publicacion) {
  return publicacion.tipo === "busco_roomie" ? "Busca roomie" : "Ofrece casa";
}

function getPrecioPublicacion(publicacion: Publicacion) {
  const monto = publicacion.tipo === "busco_roomie"
    ? publicacion.presupuestoMaximo || publicacion.precio
    : publicacion.precioMensual || publicacion.precio;

  return Number(monto || 0) > 0 ? `$${Number(monto).toLocaleString("es-CL")}` : "Sin precio";
}

export default function MiPerfil() {
  const navigate = useNavigate();
  const { user, updateProfilePhoto } = useAuth();
  const [message, setMessage] = useState("");
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [cropSource, setCropSource] = useState("");
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [deletingPublicationId, setDeletingPublicationId] = useState<number | null>(null);
  const profileImage = user?.fotoPerfil || avatarUser;
  const preferenciasResumen = getPreferenciasResumen(user?.preferenciasCompatibilidad);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      hogarService.listar(),
      usuarioService.listar(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
      publicacionService.listar(),
    ])
      .then(([hogaresResult, usuariosResult, suscripcionResult, publicacionesResult]) => {
        if (!isMounted) return;

        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);
        const backendPublicaciones = publicacionesResult.status === "fulfilled"
          ? publicacionesResult.value.map(mapBackendPublicacion)
          : [];
        const localPublicaciones = getLocalPublicaciones()
          .filter((publicacion) => !isGeneratedProfile(publicacion))
          .map((publicacion) => ({ ...publicacion, origen: "local" as const }));
        setPublicaciones([...backendPublicaciones, ...localPublicaciones]);

        if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
          setSuscripcion(suscripcionResult.value as Suscripcion);
        }
        setIsLoadingGroup(false);

        if (hogaresResult.status === "rejected" || usuariosResult.status === "rejected" || publicacionesResult.status === "rejected") {
          setMessage("No se pudo cargar toda la informacion de tu grupo.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const hogarActual = useMemo(() => {
    if (!user?.id) return undefined;

    return hogares.find((hogar) => {
      const integrantes = hogar.integrantesIds || [];
      return integrantes.includes(user.id) || hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id;
    });
  }, [hogares, user?.id]);

  const integrantes = useMemo(() => {
    if (!hogarActual) return [];

    return uniqueIds([
      hogarActual.usuarioAdministradorId,
      hogarActual.usuarioCreadorId,
      ...(hogarActual.integrantesIds || []),
    ]);
  }, [hogarActual]);

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const misPublicaciones = useMemo(() => {
    const usuarioActual = normalizarTexto(user?.usuario);
    const correoActual = normalizarTexto(user?.correo);

    return publicaciones.filter((publicacion) => {
      const creador = normalizarTexto(publicacion.usuarioCreador);
      if (!usuarioActual || creador !== usuarioActual) return false;

      if (publicacion.origen === "local") {
        const correoPublicacion = normalizarTexto(publicacion.correo);
        return !correoActual || !correoPublicacion || correoActual === correoPublicacion;
      }

      return true;
    });
  }, [publicaciones, user?.correo, user?.usuario]);

  const handleProfilePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Sube una imagen valida para tu perfil.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("La foto de perfil debe pesar menos de 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropSource(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveCroppedProfilePhoto = (image: string) => {
    setCropSource("");
    updateProfilePhoto(image).then(() => {
      setMessage("Foto de perfil actualizada.");
    });
  };

  const eliminarPublicacion = async (publicacion: Publicacion) => {
    if (!user?.usuario) {
      setMessage("No se pudo identificar tu sesion.");
      return;
    }

    const confirmar = window.confirm(`Eliminar la publicacion "${publicacion.titulo || "sin titulo"}"?`);
    if (!confirmar) return;

    try {
      setDeletingPublicationId(publicacion.id);
      if (publicacion.origen === "backend") {
        await publicacionService.eliminar(publicacion.id, user.usuario, user.role || "CLIENTE");
      } else {
        deleteLocalPublicacion(publicacion.id);
      }

      setPublicaciones((current) => current.filter((item) =>
        !(item.id === publicacion.id && item.origen === publicacion.origen)
      ));
      setMessage("Publicacion eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la publicacion.");
    } finally {
      setDeletingPublicationId(null);
    }
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
          <LogoutButton />
        </div>
      </header>

      {message && <p className="api-message">{message}</p>}

      {cropSource && (
        <ImageCropper
          source={cropSource}
          title="Ajustar foto de perfil"
          aspect={1}
          outputWidth={700}
          outputHeight={700}
          onCancel={() => setCropSource("")}
          onSave={saveCroppedProfilePhoto}
        />
      )}

      <section className="mi-perfil-hero">
        <div className="mi-perfil-card">
          <div className="profile-photo-editor">
            <img src={profileImage} alt={user?.nombre || "Mi perfil"} />
            <label className="btn btn-outline-success">
              Cambiar foto
              <input type="file" accept="image/*" onChange={handleProfilePhoto} />
            </label>
          </div>
          <div>
            <span className="demo-kicker">Mi perfil</span>
            <h1>{user?.nombre || "Martina"}</h1>
            {suscripcion && (
              <span className={`plan-badge ${PLAN_BADGE_CLASS[suscripcion.plan as PlanId]}`}>
                {PLAN_LABELS[suscripcion.plan as PlanId]}
              </span>
            )}
            <p>{user?.descripcion || "Completa tu descripcion para que otros usuarios conozcan tu estilo de convivencia."}</p>
            {user?.intereses?.length ? (
              <div className="home-tags">
                {user.intereses.map((interes) => <span className="home-tag" key={interes}>{interes}</span>)}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="mi-perfil-summary">
          <h3>Compatibilidad activa</h3>
          <strong>{preferenciasResumen.length ? "Lista" : "0%"}</strong>
          <p>{preferenciasResumen.length ? "Tus preferencias ya estan guardadas para buscar matches." : "Completa tus preferencias para activar la busqueda por compatibilidad."}</p>
          {preferenciasResumen.length ? (
            <div className="home-tags profile-preferences">
              {preferenciasResumen.map((item) => <span className="home-tag" key={item}>{item}</span>)}
            </div>
          ) : null}
          <button className="btn btn-outline-success w-100 mb-2" onClick={() => navigate("/preferencias")}>
            Editar preferencias
          </button>
          <button className="btn btn-success w-100" onClick={() => navigate("/compatibilidad")}>
            Buscar matches
          </button>
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/planes")}>
            {suscripcion && suscripcion.plan !== "GRATIS" ? "Gestionar mi plan" : "Ver planes Premium"}
          </button>
          <NotificationBell className="notification-bell-wide mt-2" title="Invitaciones y notificaciones" />

        </aside>
      </section>

      <section className="mi-grupo">
        <div className="mi-grupo-header">
          <div>
            <h2>Mis publicaciones</h2>
            <p>Gestiona tus publicaciones activas de casa o busqueda de roomie.</p>
          </div>
          <button className="btn btn-success" onClick={() => navigate("/crear-publicacion")}>
            Crear publicacion
          </button>
        </div>

        {misPublicaciones.length === 0 ? (
          <div className="sin-resultados">
            <p>Aun no tienes publicaciones creadas.</p>
          </div>
        ) : (
          <div className="module-list">
            {misPublicaciones.map((publicacion) => (
              <article className="module-item" key={`${publicacion.origen || "backend"}-${publicacion.id}`}>
                <div className="section-heading-row">
                  <h4>{publicacion.titulo || "Publicacion sin titulo"}</h4>
                  <span className="status-pill">{getTipoPublicacionLabel(publicacion)}</span>
                </div>
                <p>{publicacion.descripcion || "Sin descripcion"}</p>
                <span>
                  {publicacion.ubicacion || "Sin ubicacion"} - {getPrecioPublicacion(publicacion)}
                </span>
                <div className="item-actions">
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(publicacion.tipo === "busco_roomie" ? `/perfil/${publicacion.id}` : `/detalle-publicacion/${publicacion.id}`)}
                  >
                    Ver
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(`/crear-publicacion?editar=${publicacion.id}&origen=${publicacion.origen || "backend"}`)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={deletingPublicationId === publicacion.id}
                    onClick={() => eliminarPublicacion(publicacion)}
                  >
                    {deletingPublicationId === publicacion.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mi-grupo">
        <div className="mi-grupo-header">
          <div>
            <h2>Mi grupo roomie</h2>
            {hogarActual ? <p>{hogarActual.nombre}</p> : null}
          </div>
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>
            Ver panel convivencia
          </button>
        </div>

        {isLoadingGroup ? (
          <div className="sin-resultados"><p>Cargando integrantes del hogar...</p></div>
        ) : !hogarActual ? (
          <div className="sin-resultados">
            <p>Aun no perteneces a un grupo roomie.</p>
            <button className="btn btn-success" onClick={() => navigate("/hogares")}>
              Buscar o crear hogar
            </button>
          </div>
        ) : (
          <div className="roomie-list">
            {integrantes.map((usuarioId) => {
              const memberName = getMemberName(usuarioId, usuariosById, user || undefined);
              const fotoPerfil = usuariosById.get(usuarioId)?.fotoPerfil || (usuarioId === user?.id ? user?.fotoPerfil : "");
              const isAdmin = usuarioId === hogarActual.usuarioAdministradorId;

              return (
                <article className="roomie-card" key={usuarioId}>
                  <div className="roomie-avatar">
                    {fotoPerfil ? <img src={fotoPerfil} alt={memberName} /> : memberName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{memberName}</h4>
                    <span>{isAdmin ? "Administrador del hogar" : "Integrante"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
