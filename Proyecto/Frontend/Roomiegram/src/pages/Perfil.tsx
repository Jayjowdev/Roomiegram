import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import { getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";

function isGenericTitle(titulo?: string) {
  return !titulo?.trim() || /^perfil de\s+/i.test(titulo);
}

function getPerfilTitle(perfil: Publicacion, usuario?: UsuarioResumen) {
  if (!isGenericTitle(perfil.titulo)) return perfil.titulo;
  return usuario?.nombre ? `${usuario.nombre} busca roomie` : `${perfil.nombre || "Usuario"} busca roomie`;
}

function getPerfilLocation(perfil: Publicacion) {
  const ubicacion = perfil.ubicacion?.trim();
  return ubicacion && ubicacion !== "Ubicacion no informada" ? ubicacion : "No informada por el usuario";
}

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [perfilBackend, setPerfilBackend] = useState<Publicacion | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const perfilLocal = getLocalPublicaciones()
    .find((publicacion) => publicacion.tipo === "busco_roomie" && String(publicacion.id) === id && !isGeneratedProfile(publicacion));

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), usuarioService.listar()])
      .then(([hogaresResult, usuariosResult]) => {
        if (hogaresResult.status === "fulfilled") setHogares(hogaresResult.value);
        if (usuariosResult.status === "fulfilled") setUsuarios(usuariosResult.value);
        if (hogaresResult.status === "rejected" || usuariosResult.status === "rejected") {
          setMessage("No se pudieron cargar todos los datos del perfil.");
        }
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    publicacionService
      .listar()
      .then((publicaciones) => {
        if (!isMounted) return;

        const encontrada = publicaciones.find(
          (publicacion) => publicacion.tipo === "busco_roomie" && String(publicacion.id) === id,
        );

        setPerfilBackend(
          encontrada
            ? {
                ...encontrada,
                tipo: "busco_roomie",
                nombre: encontrada.nombre || encontrada.usuarioCreador,
                presupuestoMaximo: encontrada.presupuestoMaximo ?? encontrada.precio,
              }
            : null,
        );
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [id]);

  const usuarioPerfil = useMemo(() => {
    const usuarioId = perfilLocal?.usuarioId || perfilBackend?.usuarioId;
    if (usuarioId) {
      return usuarios.find((item) => item.id === usuarioId);
    }

    const usuarioCreador = normalizeText(perfilBackend?.usuarioCreador || perfilLocal?.usuarioCreador);
    if (usuarioCreador) {
      return usuarios.find((item) => normalizeText(item.usuario) === usuarioCreador);
    }

    const idNumerico = Number(id);
    return Number.isFinite(idNumerico)
      ? usuarios.find((item) => item.id === idNumerico)
      : undefined;
  }, [id, perfilBackend?.usuarioCreador, perfilBackend?.usuarioId, perfilLocal?.usuarioCreador, perfilLocal?.usuarioId, usuarios]);

  const perfil = useMemo<Publicacion | null>(() => {
    if (perfilLocal) return perfilLocal;
    if (perfilBackend) return perfilBackend;
    if (!usuarioPerfil) return null;

    return {
      id: usuarioPerfil.id,
      tipo: "busco_roomie",
      usuarioId: usuarioPerfil.id,
      usuarioCreador: usuarioPerfil.usuario,
      nombre: usuarioPerfil.nombre || usuarioPerfil.usuario,
      titulo: `${usuarioPerfil.nombre || usuarioPerfil.usuario} busca roomie`,
      ubicacion: usuarioPerfil.hogarActual || "Ubicacion no informada",
      descripcion: usuarioPerfil.descripcion || "Usuario registrado con preferencias de convivencia.",
      presupuestoMaximo: Number(usuarioPerfil.preferenciasCompatibilidad?.presupuesto || 0),
      imagen: usuarioPerfil.fotoPerfil,
      telefono: usuarioPerfil.telefono,
      correo: usuarioPerfil.correo,
      intereses: usuarioPerfil.intereses,
      habitos: usuarioPerfil.preferenciasCompatibilidad
        ? [
            usuarioPerfil.preferenciasCompatibilidad.limpieza,
            usuarioPerfil.preferenciasCompatibilidad.ambiente,
            usuarioPerfil.preferenciasCompatibilidad.horario,
            usuarioPerfil.preferenciasCompatibilidad.mascotas,
            usuarioPerfil.preferenciasCompatibilidad.fumar,
          ]
        : [],
    };
  }, [perfilBackend, perfilLocal, usuarioPerfil]);

  const perfilUsuarioId = perfil?.usuarioId || usuarioPerfil?.id;

  const hogarDelPerfil = useMemo(() => {
    if (!perfilUsuarioId) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === perfilUsuarioId
      || hogar.usuarioAdministradorId === perfilUsuarioId
      || hogar.integrantesIds?.includes(perfilUsuarioId),
    ) || null;
  }, [hogares, perfilUsuarioId]);

  const miHogar = useMemo(() => {
    if (!user?.id) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === user.id
      || hogar.usuarioAdministradorId === user.id
      || hogar.integrantesIds?.includes(user.id),
    ) || null;
  }, [hogares, user?.id]);

  const miHogarAdministrable = useMemo(() => {
    if (!user?.id) return null;
    return hogares.find((hogar) =>
      hogar.usuarioCreadorId === user.id || hogar.usuarioAdministradorId === user.id,
    ) || null;
  }, [hogares, user?.id]);

  const yaEstoyEnHogarPerfil = !!user?.id && !!hogarDelPerfil?.integrantesIds?.includes(user.id);
  const solicitudPendiente = !!user?.id && !!hogarDelPerfil?.solicitudesPendientesIds?.includes(user.id);
  const esMiPerfil = !!user?.id && perfilUsuarioId === user.id;

  const solicitarIngreso = async () => {
    if (!user?.id || !hogarDelPerfil?.id) return;

    try {
      setIsSending(true);
      const actualizado = await hogarService.solicitarIngreso(hogarDelPerfil.id, { usuarioId: user.id });
      setHogares((current) => current.map((hogar) => hogar.id === actualizado.id ? actualizado : hogar));

      const usuarioReceptorId = hogarDelPerfil.usuarioAdministradorId || hogarDelPerfil.usuarioCreadorId;
      let avisosEnviados = true;

      try {
        await notificacionService.crear({
          usuarioEmisorId: user.id,
          usuarioReceptorId,
          hogarId: hogarDelPerfil.id,
          referenciaId: user.id,
          tipo: "INVITACION_HOGAR",
          estado: "PENDIENTE",
          titulo: "Solicitud de ingreso pendiente",
          mensaje: `${user.nombre || user.usuario} quiere unirse al grupo ${hogarDelPerfil.nombre}.`,
        });
      } catch {
        avisosEnviados = false;
      }

      try {
        const correo = await usuarioService.enviarCorreoSolicitudRecibida({
          usuarioReceptorId,
          usuarioSolicitanteId: user.id,
          solicitanteNombre: user.nombre || user.usuario,
          hogarNombre: hogarDelPerfil.nombre,
          publicacionTitulo: getPerfilTitle(perfil!, usuarioPerfil),
        });
        avisosEnviados = avisosEnviados && correo.enviado;
      } catch {
        avisosEnviados = false;
      }

      setMessage(avisosEnviados
        ? "Solicitud enviada correctamente. Se aviso al administrador del hogar."
        : "Solicitud enviada correctamente, pero no se pudo enviar alguno de los avisos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setIsSending(false);
    }
  };

  const invitarAMiGrupo = async () => {
    if (!user?.id || !miHogarAdministrable?.id || !perfilUsuarioId) return;

    try {
      setIsSending(true);
      await notificacionService.crear({
        usuarioEmisorId: user.id,
        usuarioReceptorId: perfilUsuarioId,
        hogarId: miHogarAdministrable.id,
        referenciaId: miHogarAdministrable.id,
        tipo: "INVITACION_HOGAR",
        estado: "PENDIENTE",
        titulo: "Invitacion a grupo roomie",
        mensaje: `${user.nombre || user.usuario} te invito a unirte al grupo ${miHogarAdministrable.nombre}.`,
      });
      setMessage("Invitacion enviada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la invitacion.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver</button>
          <LogoutButton />
        </div>
      </header>

      {message && <p className="api-message">{message}</p>}

      {!perfil ? (
        <div className="sin-resultados">
          <p>No se encontro el perfil de esta publicacion.</p>
        </div>
      ) : (
        <main className="perfil-container">
          <section className="perfil-image">
            {perfil.imagen && <img src={perfil.imagen} alt={perfil.nombre || "Perfil roomie"} />}
          </section>

          <section className="perfil-info">
            <div className="perfil-publication-summary">
              <span className="demo-kicker">Publicacion</span>
              <h1>{getPerfilTitle(perfil, usuarioPerfil)}</h1>
              <p className="perfil-ubicacion">Ubicacion: {getPerfilLocation(perfil)}</p>
              <p className="perfil-bio">{perfil.descripcion}</p>
            </div>

            <div className="perfil-section">
              <h3>Publicado por</h3>
              <p><strong>{perfil.nombre}{perfil.edad ? `, ${perfil.edad}` : ""}</strong></p>
            </div>

            <div className="perfil-section">
              <h3>Busca hogar</h3>
              <p>
                Presupuesto maximo:{" "}
                <strong>${Number(perfil.presupuestoMaximo || perfil.precio || 0).toLocaleString("es-CL")} / mes</strong>
              </p>
            </div>

            <div className="perfil-section">
              <h3>Contacto</h3>
              <p><strong>Telefono:</strong> {perfil.telefono || usuarioPerfil?.telefono || "No disponible en esta sesion"}</p>
              {(perfil.correo || usuarioPerfil?.correo) && <p><strong>Correo:</strong> {perfil.correo || usuarioPerfil?.correo}</p>}
            </div>

            <div className="perfil-section">
              <h3>Grupo roomie</h3>
              {hogarDelPerfil ? (
                <p>Grupo actual: <strong>{hogarDelPerfil.nombre}</strong></p>
              ) : (
                <p>Este usuario aun no aparece asociado a un grupo hogar.</p>
              )}
              {esMiPerfil ? (
                <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Ir a mi perfil</button>
              ) : yaEstoyEnHogarPerfil ? (
                <span className="status-pill">Ya perteneces a este grupo</span>
              ) : solicitudPendiente ? (
                <span className="status-pill">Solicitud enviada</span>
              ) : hogarDelPerfil ? (
                <button className="btn btn-success" disabled={isSending} onClick={solicitarIngreso}>
                  {isSending ? "Enviando..." : "Solicitar unirme a su grupo"}
                </button>
              ) : miHogarAdministrable ? (
                <button className="btn btn-success" disabled={isSending} onClick={invitarAMiGrupo}>
                  {isSending ? "Enviando..." : "Invitar a mi grupo"}
                </button>
              ) : miHogar ? (
                <p>Tu grupo existe, pero solo el administrador puede invitar integrantes.</p>
              ) : (
                <button className="btn btn-outline-success" onClick={() => navigate("/hogares")}>Crear o buscar grupo</button>
              )}
            </div>

            {!!perfil.intereses?.length && (
              <div className="perfil-section">
                <h3>Intereses y estilo</h3>
                <div className="perfil-tags">
                  {perfil.intereses.map((interes) => <span className="perfil-tag" key={interes}>{interes}</span>)}
                </div>
              </div>
            )}

            {!!perfil.habitos?.length && (
              <div className="perfil-section">
                <h3>Habitos de convivencia</h3>
                <div className="perfil-tags">
                  {perfil.habitos.map((habito) => (
                    <span className="perfil-tag secondary" key={habito}>{habito.replaceAll("_", " ")}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
