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
import {
  isPremiumHogar,
  isPremiumPlan,
  membresiaService,
  PLAN_ACTIVE_BENEFIT,
  PLAN_BADGE_CLASS,
  PLAN_LABELS,
  PLAN_STATUS_TEXT,
  type PlanId,
  type Suscripcion,
} from "../services/membresiaService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";
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

export default function MiPerfil() {
  const navigate = useNavigate();
  const { user, updateProfilePhoto } = useAuth();
  const [message, setMessage] = useState("");
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [cropSource, setCropSource] = useState("");
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const profileImage = user?.fotoPerfil || avatarUser;
  const preferenciasResumen = getPreferenciasResumen(user?.preferenciasCompatibilidad);
  const planActual: PlanId = suscripcion?.plan ?? "GRATIS";

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      hogarService.listar(),
      usuarioService.listar(),
      user?.id ? membresiaService.obtenerActiva(user.id) : Promise.resolve(null),
    ])
      .then(([hogaresResult, usuariosResult, suscripcionResult]) => {
        if (!isMounted) return;

        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

        if (suscripcionResult.status === "fulfilled" && suscripcionResult.value) {
          setSuscripcion(suscripcionResult.value as Suscripcion);
        }
        setIsLoadingGroup(false);

        if (hogaresResult.status === "rejected" || usuariosResult.status === "rejected") {
          setMessage("No se pudo cargar toda la información de tu grupo.");
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

  const handleProfilePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Sube una imagen válida para tu perfil.");
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
            {suscripcion && <span className={`plan-badge ${PLAN_BADGE_CLASS[planActual]}`}>{PLAN_LABELS[planActual]}</span>}
            <p>{user?.descripcion || "Completa tu descripción para que otros usuarios conozcan tu estilo de convivencia."}</p>
            <p>{PLAN_STATUS_TEXT[planActual]}. {PLAN_ACTIVE_BENEFIT[planActual]}</p>
            {user?.intereses?.length ? (
              <div className="home-tags">
                {user.intereses.map((interes) => <span className="home-tag" key={interes}>{interes}</span>)}
              </div>
            ) : null}
            <div className="profile-main-actions">
              <button className="btn btn-success" type="button" onClick={() => navigate("/configuracion")}>
                Editar configuración
              </button>
              <button className="btn btn-outline-success" type="button" onClick={() => navigate(`/perfil-publico/${user?.id}`)}>
                Ver perfil público
              </button>
            </div>
          </div>
        </div>

        <aside className="mi-perfil-summary">
          <h3>Compatibilidad activa</h3>
          <strong>{preferenciasResumen.length ? "Lista" : "0%"}</strong>
          <p>{preferenciasResumen.length ? "Tus preferencias ya están guardadas para buscar matches." : "Completa tus preferencias para activar la búsqueda por compatibilidad."}</p>
          {preferenciasResumen.length ? (
            <div className="home-tags profile-preferences">
              {preferenciasResumen.map((item) => <span className="home-tag" key={item}>{item}</span>)}
            </div>
          ) : null}
          <button className="btn btn-outline-success w-100 mb-2" onClick={() => navigate("/preferencias")}>
            Preferencias de convivencia
          </button>
          <button className="btn btn-success w-100" onClick={() => navigate("/compatibilidad")}>
            Buscar matches
          </button>
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/hogares")}>
            Mis hogares
          </button>
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/planes")}>
            {isPremiumPlan(planActual) ? "Gestionar mi plan" : "Ver planes Premium"}
          </button>
          <p className="api-message mt-2">
            {planActual === "GRATIS"
              ? "Con el plan gratis no tienes reportes avanzados del hogar ni beneficios destacados de compatibilidad."
              : PLAN_ACTIVE_BENEFIT[planActual]}
          </p>
          {planActual === "PREMIUM_INDIVIDUAL" && (
            <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/compatibilidad")}>
              Usar beneficio Premium Individual
            </button>
          )}
          {isPremiumHogar(planActual) && (
            <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/crear-publicacion")}>
              Crear publicación para mi hogar
            </button>
          )}
          <NotificationBell className="notification-bell-wide mt-2" title="Invitaciones y notificaciones" />

        </aside>
      </section>

      <section className="mi-grupo profile-publications-entry">
        <div>
          <span className="demo-kicker">Publicaciones</span>
          <h2>Mis publicaciones</h2>
          <p>Administra las publicaciones que has creado, revisa sus datos o crea una nueva cuando lo necesites.</p>
        </div>
        <div className="profile-publications-actions">
          <button className="btn btn-success" onClick={() => navigate("/mis-publicaciones")}>
            Ver mis publicaciones
          </button>
          <button className="btn btn-outline-success" onClick={() => navigate("/crear-publicacion")}>
            Crear publicación
          </button>
        </div>
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
            <p>Aún no perteneces a un grupo roomie.</p>
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
