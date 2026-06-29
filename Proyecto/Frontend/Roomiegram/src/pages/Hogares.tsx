import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";
import { deleteLocalPublicacion } from "../utils/localPublicaciones";

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return (
    hogar.integrantesIds?.includes(userId) ||
    hogar.usuarioAdministradorId === userId ||
    hogar.usuarioCreadorId === userId
  );
}

function isHogarAdmin(hogar: Hogar, userId?: number) {
  return !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function isSeedHogar(hogar: Hogar) {
  const descripcion = hogar.descripcion?.toLowerCase().trim() || "";
  const nombre = hogar.nombre?.toLowerCase().trim() || "";

  return (
    descripcion.includes("hogar inicial de ejemplo") ||
    descripcion.includes("pruebas del microservicio") ||
    nombre === "hogar de ejemplo"
  );
}

function formatMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string },
) {
  if (usuarioId === currentUser?.id) {
    return currentUser.nombre || currentUser.usuario || "Tu";
  }

  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || `Usuario #${usuarioId}`;
}

export default function Hogares() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [nombre, setNombre] = useState(() => {
    const titulo = searchParams.get("titulo")?.trim();
    return titulo ? `Hogar de ${titulo}` : "";
  });
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState("");
  const [showPrivateHogarForm, setShowPrivateHogarForm] = useState(false);

  const loadHogares = () => {
    setIsLoading(true);
    Promise.allSettled([hogarService.listar(), usuarioService.listar()])
      .then(([hogaresResult, usuariosResult]) => {
        const hogaresData = hogaresResult.status === "fulfilled"
          ? hogaresResult.value.filter((hogar) => !isSeedHogar(hogar))
          : [];

        setHogares(hogaresData);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

        if (hogaresResult.status === "rejected") {
          setMessage("Servicio no disponible. Intenta nuevamente.");
        } else {
          setMessage(hogaresData.length ? "" : "No hay hogares registrados.");
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadHogares, []);

  const misHogares = useMemo(() => {
    return hogares.filter((hogar) => userBelongsToHogar(hogar, user?.id));
  }, [hogares, user?.id]);

  const canCreateHogar = misHogares.length === 0;

  const buscarPublicacionesCasa = () => {
    navigate("/home?tipo=ofrezco_casa");
  };

  const crearPublicacionCasa = (hogarId?: number) => {
    const params = new URLSearchParams({ tipo: "ofrezco_casa" });
    if (hogarId) params.set("hogarId", String(hogarId));
    navigate(`/crear-publicacion?${params.toString()}`);
  };

  const hogaresAdministrablesSinPublicacion = useMemo(() => {
    return misHogares.filter((hogar) => isHogarAdmin(hogar, user?.id) && (hogar.publicacionIds?.length ?? 0) === 0);
  }, [misHogares, user?.id]);

  const publicacionContexto = useMemo(() => {
    const publicacionId = Number(searchParams.get("publicacionId"));
    if (!Number.isFinite(publicacionId) || publicacionId <= 0) return null;

    return {
      id: publicacionId,
      titulo: searchParams.get("titulo")?.trim() || "Publicacion sin titulo",
      tipo: searchParams.get("tipo")?.trim() || "ofrezco_casa",
    };
  }, [searchParams]);

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const updateHogar = (hogarActualizado: Hogar) => {
    setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!user?.id) {
      setMessage("Debes iniciar sesion para crear un hogar.");
      return;
    }

    if (!canCreateHogar) {
      setMessage("Ya perteneces a un hogar. Usa el panel de convivencia para organizar tu grupo.");
      return;
    }

    if (nombre.trim().length < 3) {
      setMessage("El nombre del hogar debe tener al menos 3 caracteres.");
      return;
    }

    if (descripcion.trim() && descripcion.trim().length < 10) {
      setMessage("La descripcion debe tener al menos 10 caracteres o quedar vacia.");
      return;
    }

    setIsSaving(true);

    try {
      const creado = await hogarService.crear({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        usuarioCreadorId: user.id,
      });

      let hogarParaGuardar = creado;
      let successMessage = "Hogar creado correctamente.";

      if (publicacionContexto) {
        try {
          hogarParaGuardar = await hogarService.agregarPublicacion(creado.id, user.id, publicacionContexto.id);
          successMessage = "Hogar creado y vinculado a la publicacion correctamente.";
          setSearchParams({});
        } catch {
          successMessage = "Hogar creado, pero no se pudo vincular automaticamente a la publicacion.";
        }
      }

      setHogares((current) => [...current, hogarParaGuardar]);
      setMessage(successMessage);
      setNombre("");
      setDescripcion("");
      setShowPrivateHogarForm(false);
    } catch {
      setMessage("Servicio no disponible. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const aprobarSolicitud = async (hogarId: number, usuarioId: number) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(`aprobar-${hogarId}-${usuarioId}`);
      const hogar = hogares.find((item) => item.id === hogarId);
      const actualizado = await hogarService.aprobarSolicitud(hogarId, usuarioId, { administradorId: user.id });
      updateHogar(actualizado);
      let correoEnviado = true;
      try {
        const correo = await usuarioService.enviarCorreoSolicitudResuelta({
          usuarioSolicitanteId: usuarioId,
          administradorId: user.id,
          hogarNombre: hogar?.nombre || actualizado.nombre,
          aceptada: true,
        });
        correoEnviado = correo.enviado;
      } catch {
        correoEnviado = false;
      }
      setMessage(correoEnviado
        ? "Solicitud aprobada. Se aviso al solicitante por correo."
        : "Solicitud aprobada, pero no se pudo enviar el correo al solicitante.");
    } catch {
      setMessage("No se pudo aprobar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  const rechazarSolicitud = async (hogarId: number, usuarioId: number) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(`rechazar-${hogarId}-${usuarioId}`);
      const hogar = hogares.find((item) => item.id === hogarId);
      const actualizado = await hogarService.rechazarSolicitud(hogarId, usuarioId, { administradorId: user.id });
      updateHogar(actualizado);
      let correoEnviado = true;
      try {
        const correo = await usuarioService.enviarCorreoSolicitudResuelta({
          usuarioSolicitanteId: usuarioId,
          administradorId: user.id,
          hogarNombre: hogar?.nombre || actualizado.nombre,
          aceptada: false,
        });
        correoEnviado = correo.enviado;
      } catch {
        correoEnviado = false;
      }
      setMessage(correoEnviado
        ? "Solicitud rechazada. Se aviso al solicitante por correo."
        : "Solicitud rechazada, pero no se pudo enviar el correo al solicitante.");
    } catch {
      setMessage("No se pudo rechazar la solicitud.");
    } finally {
      setProcessingRequest("");
    }
  };

  const eliminarHogar = async (hogar: Hogar) => {
    if (!user?.id) return;
    const publicacionesAsociadas = hogar.publicacionIds || [];

    try {
      await hogarService.eliminar(hogar.id, user.id);
      setHogares((current) => current.filter((item) => item.id !== hogar.id));

      if (publicacionesAsociadas.length === 0) {
        setMessage("Hogar eliminado correctamente.");
        return;
      }

      const resultados = await Promise.allSettled(
        publicacionesAsociadas.map((publicacionId) =>
          publicacionService.eliminar(publicacionId, user.usuario, user.role || "CLIENTE")
        )
      );

      publicacionesAsociadas.forEach((publicacionId) => deleteLocalPublicacion(publicacionId));

      const fallidas = resultados.filter((result) => result.status === "rejected").length;
      setMessage(
        fallidas
          ? "Hogar eliminado, pero no se pudieron eliminar todas sus publicaciones asociadas."
          : "Hogar y publicacion asociada eliminados correctamente."
      );
    } catch {
      setMessage("No se pudo eliminar el hogar. Solo el administrador puede realizar esta accion.");
    }
  };

  const salirDelHogar = async (hogar: Hogar) => {
    if (!user?.id) return;

    if (isHogarAdmin(hogar, user.id)) {
      setMessage("El administrador debe transferir o eliminar el hogar para salir.");
      return;
    }

    const confirmar = window.confirm(`Salir del hogar "${hogar.nombre}"?`);
    if (!confirmar) return;

    try {
      setProcessingRequest(`salir-${hogar.id}`);
      const actualizado = await hogarService.salir(hogar.id, user.id, user.id);
      updateHogar(actualizado);
      setMessage("Saliste del hogar correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo salir del hogar.");
    } finally {
      setProcessingRequest("");
    }
  };

  const quitarIntegrante = async (hogar: Hogar, usuarioId: number) => {
    if (!user?.id) return;

    const nombreIntegrante = formatMemberName(usuarioId, usuariosById, user || undefined);
    const confirmar = window.confirm(`Quitar a ${nombreIntegrante} del hogar "${hogar.nombre}"?`);
    if (!confirmar) return;

    try {
      setProcessingRequest(`quitar-${hogar.id}-${usuarioId}`);
      const actualizado = await hogarService.quitarIntegrante(hogar.id, usuarioId, user.id);
      updateHogar(actualizado);
      setMessage(`${nombreIntegrante} fue removido del hogar.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo quitar al integrante.");
    } finally {
      setProcessingRequest("");
    }
  };

  const renderHogarCard = (hogar: Hogar) => {
    const isAdmin = isHogarAdmin(hogar, user?.id);
    const integrantes = hogar.integrantesIds || [];
    const solicitudes = hogar.solicitudesPendientesIds || [];

    return (
      <article className="module-item hogar-card hogar-card-mine" key={hogar.id}>
        <div className="section-heading-row">
          <div>
            <h4>{hogar.nombre}</h4>
            <p>{hogar.descripcion || "Sin descripcion"}</p>
          </div>
          <span className={hogar.activo ? "status-pill success" : "status-pill"}>
            {hogar.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="hogar-meta-grid">
          <span><strong>{integrantes.length}</strong> integrante(s)</span>
          <span><strong>{solicitudes.length}</strong> solicitud(es)</span>
          <span><strong>{hogar.tareasIds?.length || 0}</strong> tarea(s)</span>
          <span><strong>{hogar.hogarCuentaIds?.length || 0}</strong> gasto(s)</span>
        </div>

        <div className="home-tags mt-3">
          {integrantes.length === 0 ? (
            <span className="home-tag">Sin integrantes registrados</span>
          ) : (
            integrantes.map((usuarioId) => (
              <span className="home-tag" key={usuarioId}>
                {formatMemberName(usuarioId, usuariosById, user || undefined)}
                {usuarioId === hogar.usuarioAdministradorId ? " - Admin" : ""}
              </span>
            ))
          )}
        </div>

        {isAdmin && integrantes.length > 1 && (
          <div className="hogar-integrantes-admin-list">
            <h5>Gestion de integrantes</h5>
            {integrantes
              .filter((usuarioId) => usuarioId !== user?.id)
              .map((usuarioId) => (
                <div className="hogar-integrante-row" key={usuarioId}>
                  <span>{formatMemberName(usuarioId, usuariosById, user || undefined)}</span>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={Boolean(processingRequest)}
                    onClick={() => quitarIntegrante(hogar, usuarioId)}
                  >
                    {processingRequest === `quitar-${hogar.id}-${usuarioId}` ? "Quitando..." : "Quitar integrante"}
                  </button>
                </div>
              ))}
          </div>
        )}

        <div className="item-actions">
          <button className="btn btn-success btn-sm" type="button" onClick={() => navigate("/convivencia")}>
            Ver convivencia
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            type="button"
            disabled={processingRequest === `salir-${hogar.id}`}
            onClick={() => salirDelHogar(hogar)}
          >
            {processingRequest === `salir-${hogar.id}` ? "Saliendo..." : "Salir del hogar"}
          </button>
          {isAdmin && (
            <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => eliminarHogar(hogar)}>
              Eliminar
            </button>
          )}
        </div>

        {isAdmin && solicitudes.length > 0 && (
          <div className="request-list">
            <h5>Solicitudes por revisar</h5>
            {solicitudes.map((usuarioId) => (
              <div className="request-row" key={usuarioId}>
                <span>{formatMemberName(usuarioId, usuariosById, user || undefined)}</span>
                <div>
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    disabled={Boolean(processingRequest)}
                    onClick={() => aprobarSolicitud(hogar.id, usuarioId)}
                  >
                    {processingRequest === `aprobar-${hogar.id}-${usuarioId}` ? "Aprobando..." : "Aprobar"}
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={Boolean(processingRequest)}
                    onClick={() => rechazarSolicitud(hogar.id, usuarioId)}
                  >
                    {processingRequest === `rechazar-${hogar.id}-${usuarioId}` ? "Rechazando..." : "Rechazar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/convivencia")}>
            Panel convivencia
          </button>
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Inicio
          </button>
          {user?.role === "ADMIN" && (
            <button className="btn btn-outline-success" type="button" onClick={() => navigate("/dashboard")}>
              Admin
            </button>
          )}
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Mis hogares</h1>
        <p>Gestiona tu hogar actual, revisa solicitudes y entra al panel de convivencia de tu grupo roomie.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <section className="module-list hogares-loading-panel">
          <div className="sin-resultados"><p>Cargando hogares...</p></div>
        </section>
      ) : canCreateHogar ? (
        <section className="module-list hogares-empty-flow">
          <section className="module-item hogares-path-card hogares-path-primary">
            <span className="eyebrow">Camino principal</span>
            <h3>Ofrecer casa o habitacion</h3>
            <p>
              Crea una publicacion de casa para que otros usuarios puedan encontrarte y enviarte solicitudes.
            </p>
            <button className="btn btn-success" type="button" onClick={() => crearPublicacionCasa()}>
              Crear publicacion de casa
            </button>
          </section>

          <section className="module-item hogares-path-card">
            <span className="eyebrow">Flujo secundario</span>
            <h3>Ya tengo un grupo y quiero gestionar convivencia</h3>
            <p>
              Crea un hogar privado para organizar integrantes, tareas y gastos.
            </p>
            <div className="item-actions">
              <button
                className="btn btn-outline-success"
                type="button"
                onClick={() => setShowPrivateHogarForm((current) => !current)}
              >
                {showPrivateHogarForm ? "Ocultar formulario" : "Crear hogar privado"}
              </button>
              <button className="btn btn-outline-success" type="button" onClick={buscarPublicacionesCasa}>
                Buscar publicaciones de casa
              </button>
            </div>
          </section>

          {(showPrivateHogarForm || publicacionContexto) && (
            <form className="module-form hogares-private-form" onSubmit={handleSubmit}>
              <h3>Crear hogar privado</h3>
              <p className="form-helper">
                Usa este flujo solo si el grupo ya existe y quieres gestionar convivencia interna.
              </p>
              {publicacionContexto && (
                <p className="api-message">
                  Crear hogar para la publicacion: {publicacionContexto.titulo}
                </p>
              )}
              <input
                className="form-control"
                placeholder="Nombre del hogar"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
              />
              <textarea
                className="form-control"
                placeholder="Descripcion del hogar"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
              />
              <button className="btn btn-success w-100" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Crear hogar privado"}
              </button>
            </form>
          )}
        </section>
      ) : (
        <section className="hogares-product-layout">
          <div className="module-list hogares-primary-panel">
            <div className="section-heading-row hogares-primary-heading">
              <div>
                <span className="eyebrow">Hogar actual</span>
                <h2>Mi hogar actual</h2>
              </div>
              <button className="btn btn-success" type="button" onClick={() => navigate("/convivencia")}>
                Ver convivencia
              </button>
            </div>
            {misHogares.map((hogar) => renderHogarCard(hogar))}
            {hogaresAdministrablesSinPublicacion.length > 0 && (
              <div className="module-item hogar-next-step">
                <span className="eyebrow">Siguiente paso</span>
                <h3>Tu hogar todavia no tiene una publicacion de casa vinculada</h3>
                <p>
                  Crea una publicacion para recibir solicitudes y mantenerlas asociadas a este mismo hogar.
                </p>
                <div className="item-actions">
                  {hogaresAdministrablesSinPublicacion.length === 1 ? (
                    <button
                      className="btn btn-success"
                      type="button"
                      onClick={() => crearPublicacionCasa(hogaresAdministrablesSinPublicacion[0].id)}
                    >
                      Crear publicacion de casa
                    </button>
                  ) : (
                    hogaresAdministrablesSinPublicacion.map((hogar) => (
                      <button
                        className="btn btn-success"
                        type="button"
                        key={hogar.id}
                        onClick={() => crearPublicacionCasa(hogar.id)}
                      >
                        Crear publicacion para {hogar.nombre}
                      </button>
                    ))
                  )}
                  <button className="btn btn-outline-success" type="button" onClick={() => navigate("/convivencia")}>
                    Ver convivencia
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
