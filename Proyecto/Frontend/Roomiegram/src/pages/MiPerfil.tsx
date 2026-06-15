import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import avatarUser from "../assets/avatarUser.svg";
import { ImageCropper } from "../components/ImageCropper";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { hogarService } from "../services/hogarService";
import { membresiaService, PLAN_BADGE_CLASS, PLAN_LABELS, type PlanId, type Suscripcion } from "../services/membresiaService";
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
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const profileImage = user?.fotoPerfil || avatarUser;
  const preferenciasResumen = getPreferenciasResumen(user?.preferenciasCompatibilidad);

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

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!user?.id) {
      setPasswordError("Debes iniciar sesion para cambiar tu contrasena.");
      return;
    }

    if (!contrasenaActual.trim()) {
      setPasswordError("Ingresa tu contrasena actual.");
      return;
    }

    if (nuevaContrasena.length < 8) {
      setPasswordError("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setPasswordError("La nueva contrasena y la confirmacion no coinciden.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await authService.changePassword(user.id, {
        contrasenaActual,
        nuevaContrasena,
        confirmarContrasena,
      });
      setPasswordMessage(response.mensaje || "Contrasena actualizada correctamente.");
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "No se pudo cambiar la contrasena.");
    } finally {
      setIsChangingPassword(false);
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
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/crear-publicacion")}>
            Crear publicacion
          </button>
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/planes")}>
            {suscripcion && suscripcion.plan !== "GRATIS" ? "Gestionar mi plan" : "Ver planes Premium"}
          </button>
          <NotificationBell className="notification-bell-wide mt-2" title="Invitaciones y notificaciones" />
        </aside>
      </section>

      <section className="profile-password-section">
        <div className="profile-password-card">
          <div>
            <h2>Cambiar contrasena</h2>
            <p>Usa tu contrasena temporal o actual para definir una nueva.</p>
          </div>

          <form onSubmit={handleChangePassword} className="profile-password-form">
            {passwordError && <div className="form-error">{passwordError}</div>}
            {passwordMessage && <div className="form-success">{passwordMessage}</div>}
            <input
              className="form-control"
              type="password"
              placeholder="Contrasena actual"
              value={contrasenaActual}
              onChange={(event) => setContrasenaActual(event.target.value)}
              disabled={isChangingPassword}
            />
            <input
              className="form-control"
              type="password"
              placeholder="Nueva contrasena"
              value={nuevaContrasena}
              onChange={(event) => setNuevaContrasena(event.target.value)}
              disabled={isChangingPassword}
            />
            <input
              className="form-control"
              type="password"
              placeholder="Confirmar nueva contrasena"
              value={confirmarContrasena}
              onChange={(event) => setConfirmarContrasena(event.target.value)}
              disabled={isChangingPassword}
            />
            <button className="btn btn-success" type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Actualizando..." : "Actualizar contrasena"}
            </button>
          </form>
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
