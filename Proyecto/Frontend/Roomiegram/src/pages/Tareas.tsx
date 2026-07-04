import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { tareaService } from "../services/tareaService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { Tarea } from "../types/Tarea";
import type { UsuarioResumen } from "../types/Usuario";

const initialForm = {
  titulo: "",
  encargadoId: "",
  descripcion: "",
  fecha: "",
};

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return hogar.integrantesIds?.includes(userId) || hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId;
}

function isHogarAdmin(hogar?: Hogar, userId?: number) {
  return !!hogar && !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function formatRealMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string },
) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tu";

  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || formatMemberName(usuarioId, currentUser);
}

function formatMemberName(usuarioId: number, currentUser?: { id: number; nombre?: string; usuario?: string }) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tú";
  return "Integrante del hogar";
}

function findMemberIdByName(
  encargado: string,
  integrantes: number[],
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string },
) {
  const normalized = encargado.trim().toLowerCase();
  const match = integrantes.find((usuarioId) =>
    formatRealMemberName(usuarioId, usuariosById, currentUser).trim().toLowerCase() === normalized
  );

  return match ? String(match) : "";
}

function isTaskCompleted(tarea: Tarea) {
  return tarea.completada === true;
}

function normalizeTaskText(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function isTaskAssignedToCurrentUser(tarea: Tarea, currentUser?: { nombre?: string; usuario?: string }) {
  const encargado = normalizeTaskText(tarea.encargado);
  if (!encargado) return false;

  return [currentUser?.nombre, currentUser?.usuario]
    .map(normalizeTaskText)
    .filter(Boolean)
    .includes(encargado);
}

function getTaskSortValue(tarea: Tarea) {
  const taskWithDates = tarea as Tarea & { createdAt?: string; fechaCreacion?: string };
  const dateValue = taskWithDates.createdAt || taskWithDates.fechaCreacion;
  const parsedDate = dateValue ? new Date(dateValue).getTime() : Number.NaN;

  return Number.isNaN(parsedDate) ? tarea.id || 0 : parsedDate;
}

export default function Tareas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), tareaService.listar(), usuarioService.listar()])
      .then(([hogaresResult, tareasResult, usuariosResult]) => {
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setTareas(tareasResult.status === "fulfilled" ? tareasResult.value : []);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

        if (hogaresResult.status === "rejected" || tareasResult.status === "rejected" || usuariosResult.status === "rejected") {
          setMessage("Algunos datos no se pudieron cargar. Revisa que los servicios estén activos.");
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const hogarActual = useMemo(() => {
    return hogares.find((hogar) => userBelongsToHogar(hogar, user?.id));
  }, [hogares, user?.id]);

  const integrantes = useMemo(() => {
    if (!hogarActual) return [];
    return [...new Set([hogarActual.usuarioAdministradorId, hogarActual.usuarioCreadorId, ...(hogarActual.integrantesIds || [])])];
  }, [hogarActual]);

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const tareasDelHogar = useMemo(() => {
    if (!hogarActual?.tareasIds?.length) return [];
    return tareas
      .filter((tarea) => hogarActual.tareasIds.includes(tarea.id))
      .sort((a, b) => getTaskSortValue(b) - getTaskSortValue(a));
  }, [hogarActual, tareas]);

  const tareasActivas = useMemo(() => tareasDelHogar.filter((tarea) => !isTaskCompleted(tarea)), [tareasDelHogar]);
  const tareasCompletadas = useMemo(() => tareasDelHogar.filter(isTaskCompleted), [tareasDelHogar]);

  const canManage = isHogarAdmin(hogarActual, user?.id);
  const isEditing = editingTaskId !== null;

  const validateForm = () => {
    if (!hogarActual) return "Debes pertenecer a un hogar para crear tareas.";
    if (!canManage) return "Solo el administrador del hogar puede asignar nuevas tareas.";
    if (form.titulo.trim().length < 4) return "El título debe tener al menos 4 caracteres.";
    if (!form.encargadoId) return "Selecciona un integrante encargado.";
    if (form.descripcion.trim().length < 10) return "La descripción debe tener al menos 10 caracteres.";
    if (!form.fecha) return "Selecciona una fecha limite para la tarea.";
    return "";
  };

  const sendTaskAssignmentEmail = async (
    encargadoId: number,
    task: { titulo: string; descripcion: string; fecha: string },
  ) => {
    return usuarioService.enviarCorreoTareaAsignada({
      usuarioId: encargadoId,
      titulo: task.titulo,
      descripcion: task.descripcion,
      fecha: task.fecha,
      hogarNombre: hogarActual?.nombre,
      asignadorNombre: user?.nombre || user?.usuario,
    });
  };

  const notifyTaskCompleted = async (task: Tarea) => {
    if (!hogarActual || !user?.id) return { attempted: false, ok: true };

    const receptorId = hogarActual.usuarioAdministradorId || hogarActual.usuarioCreadorId;
    if (!receptorId || receptorId === user.id) {
      return { attempted: false, ok: true };
    }

    let notificacionEnviada = true;
    try {
      await notificacionService.crear({
        usuarioEmisorId: user.id,
        usuarioReceptorId: receptorId,
        hogarId: hogarActual.id,
        referenciaId: task.id,
        tipo: "TAREA_HOGAR",
        estado: "PENDIENTE",
        titulo: "Tarea completada",
        mensaje: `${user.nombre || user.usuario} completó la tarea "${task.titulo}" en ${hogarActual.nombre}.`,
      });
    } catch {
      notificacionEnviada = false;
    }

    let correoEnviado = true;
    try {
      const resultadoCorreo = await usuarioService.enviarCorreoTareaCompletada({
        usuarioReceptorId: receptorId,
        usuarioCompletadorId: user.id,
        titulo: task.titulo,
        descripcion: task.descripcion,
        fecha: task.fecha,
        hogarNombre: hogarActual.nombre,
      });
      correoEnviado = resultadoCorreo.enviado;
    } catch {
      correoEnviado = false;
    }

    return { attempted: true, ok: notificacionEnviada && correoEnviado };
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setForm(initialForm);
    setMessage("");
  };

  const startEdit = (tarea: Tarea) => {
    if (!canManage) return;

    const encargadoId = findMemberIdByName(tarea.encargado, integrantes, usuariosById, user || undefined);
    setEditingTaskId(tarea.id);
    setForm({
      titulo: tarea.titulo,
      encargadoId,
      descripcion: tarea.descripcion,
      fecha: tarea.fecha,
    });
    setMessage(encargadoId ? "" : "Selecciona nuevamente el encargado para editar esta tarea.");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const encargadoId = Number(form.encargadoId);
    setIsSaving(true);

    try {
      const payload = {
        titulo: form.titulo.trim(),
        encargado: formatRealMemberName(encargadoId, usuariosById, user || undefined),
        descripcion: form.descripcion.trim(),
        fecha: form.fecha,
      };

      if (isEditing) {
        const tareaAnterior = tareas.find((tarea) => tarea.id === editingTaskId);
        const encargadoAnteriorId = tareaAnterior
          ? findMemberIdByName(tareaAnterior.encargado, integrantes, usuariosById, user || undefined)
          : "";
        const actualizada = await tareaService.actualizar(editingTaskId!, payload);
        let correoEnviado = true;

        if (encargadoAnteriorId && encargadoAnteriorId !== form.encargadoId) {
          try {
            const resultadoCorreo = await sendTaskAssignmentEmail(encargadoId, actualizada);
            correoEnviado = resultadoCorreo.enviado;
          } catch {
            correoEnviado = false;
          }
        }

        setTareas((current) => current.map((tarea) => (tarea.id === actualizada.id ? actualizada : tarea)));
        setEditingTaskId(null);
        setForm(initialForm);
        setMessage(correoEnviado
          ? "Tarea actualizada correctamente."
          : "Tarea actualizada, pero no se pudo enviar el correo al nuevo encargado.");
        return;
      }

      const creada = await tareaService.crear({
        ...payload,
      });

      const hogarActualizado = await hogarService.agregarTarea(hogarActual!.id, {
        administradorId: user!.id,
        recursoId: creada.id,
      });

      let notificacionEnviada = true;
      try {
        await notificacionService.crear({
          usuarioEmisorId: user!.id,
          usuarioReceptorId: encargadoId,
          hogarId: hogarActual!.id,
          referenciaId: creada.id,
          tipo: "TAREA_HOGAR",
          estado: "PENDIENTE",
          titulo: "Nueva tarea asignada",
          mensaje: `${user!.nombre || user!.usuario} te asignó la tarea "${creada.titulo}" en ${hogarActual!.nombre}.`,
        });
      } catch {
        notificacionEnviada = false;
      }

      let correoEnviado = true;
      try {
        const resultadoCorreo = await sendTaskAssignmentEmail(encargadoId, creada);
        correoEnviado = resultadoCorreo.enviado;
      } catch {
        correoEnviado = false;
      }

      setTareas((current) => [...current, creada]);
      setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      setForm(initialForm);
      setMessage(notificacionEnviada && correoEnviado
        ? "Tarea creada y asociada al hogar. Se avisó al encargado."
        : "Tarea creada. No se pudo enviar alguno de los avisos al encargado.");
    } catch {
      setMessage("No se pudo guardar la tarea. Revisa que los servicios estén disponibles.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTaskStatus = async (tarea: Tarea) => {
    const canUpdateStatus = isTaskAssignedToCurrentUser(tarea, user || undefined);
    if (!canUpdateStatus) return;

    setMessage("");
    setUpdatingTaskId(tarea.id);

    try {
      const wasCompleted = isTaskCompleted(tarea);
      const actualizada = isTaskCompleted(tarea)
        ? await tareaService.pendiente(tarea.id)
        : await tareaService.completar(tarea.id);

      setTareas((current) => current.map((item) => (item.id === actualizada.id ? actualizada : item)));
      if (!wasCompleted && isTaskCompleted(actualizada)) {
        const aviso = await notifyTaskCompleted(actualizada);
        if (!aviso.attempted) {
          setMessage("Tarea marcada como completada.");
        } else {
          setMessage(aviso.ok
            ? "Tarea marcada como completada. Se avisó al administrador del hogar."
            : "Tarea marcada como completada. No se pudo enviar alguno de los avisos al administrador.");
        }
      } else {
        setMessage("Tarea marcada como pendiente.");
      }
    } catch {
      setMessage("No se pudo actualizar el estado de la tarea. Revisa que los servicios estén disponibles.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const renderTarea = (tarea: Tarea) => (
    <article className="module-item" key={tarea.id}>
      <div className="section-heading-row">
        <h4>{tarea.titulo}</h4>
        <span className={isTaskCompleted(tarea) ? "status-pill success" : "status-pill"}>
          {isTaskCompleted(tarea) ? "Completada" : "Pendiente"}
        </span>
      </div>
      <p>{tarea.descripcion}</p>
      <span>Encargado: {tarea.encargado} Â· Fecha limite: {tarea.fecha}</span>
      <div className="item-actions">
        {canManage && (
          <button className="btn btn-outline-success btn-sm" type="button" onClick={() => startEdit(tarea)}>
            Editar
          </button>
        )}
        {isTaskAssignedToCurrentUser(tarea, user || undefined) ? (
          <button
            className={isTaskCompleted(tarea) ? "btn btn-outline-success btn-sm" : "btn btn-success btn-sm"}
            type="button"
            onClick={() => toggleTaskStatus(tarea)}
            disabled={updatingTaskId === tarea.id}
          >
            {updatingTaskId === tarea.id
              ? "Actualizando..."
              : isTaskCompleted(tarea)
                ? "Marcar pendiente"
                : "Marcar completada"}
          </button>
        ) : (
          <span className="task-owner-note">Solo el responsable puede completar esta tarea</span>
        )}
      </div>
    </article>
  );

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/hogares")}>Mis hogares</button>
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Tareas del hogar</h1>
        <p>Asigna responsabilidades domésticas a integrantes de tu grupo roomie.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <div className="sin-resultados"><p>Cargando tareas...</p></div>
      ) : !hogarActual ? (
        <div className="empty-household">
          <h2>Aún no tienes un hogar</h2>
          <p>Únete o crea un grupo roomie para organizar tareas compartidas.</p>
          <button className="btn btn-success" onClick={() => navigate("/hogares")}>Ir a mis hogares</button>
        </div>
      ) : (
        <section className="module-layout">
          {canManage ? (
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>{isEditing ? "Editar tarea" : "Nueva tarea"}</h3>
            {!canManage && <p className="form-helper">Solo el administrador del hogar puede crear tareas asociadas al grupo.</p>}
            <input className="form-control" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required disabled={!canManage} />
            <select className="form-control" value={form.encargadoId} onChange={(e) => setForm({ ...form, encargadoId: e.target.value })} required disabled={!canManage}>
              <option value="">Encargado</option>
              {integrantes.map((usuarioId) => (
                <option key={usuarioId} value={usuarioId}>{formatRealMemberName(usuarioId, usuariosById, user || undefined)}</option>
              ))}
            </select>
            <textarea className="form-control" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required disabled={!canManage} />
            <label className="field-label">
              Fecha limite
              <input className="form-control" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required disabled={!canManage} />
            </label>
            <button className="btn btn-success w-100" disabled={isSaving || !canManage}>{isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Asignar tarea"}</button>
            {isEditing && (
              <button className="btn btn-outline-success w-100" type="button" onClick={cancelEdit} disabled={isSaving}>
                Cancelar edicion
              </button>
            )}
          </form>
          ) : (
            <aside className="module-form task-permission-panel">
              <h3>Tareas del hogar</h3>
              <p className="form-helper">Solo el administrador del hogar puede crear y editar tareas.</p>
            </aside>
          )}

          <div className="module-list">
            <h3>Tareas de {hogarActual.nombre}</h3>
            {tareasDelHogar.length === 0 ? (
              <div className="sin-resultados"><p>No hay tareas asociadas a este hogar.</p></div>
            ) : (
              <>
                <div className="history-section">
                  <div className="section-heading-row">
                    <h4>Tareas pendientes</h4>
                    <span className="status-pill">{tareasActivas.length}</span>
                  </div>
                  {tareasActivas.length === 0 ? (
                    <div className="sin-resultados"><p>No hay tareas pendientes.</p></div>
                  ) : tareasActivas.map(renderTarea)}
                </div>

                <div className="history-section">
                  <div className="section-heading-row">
                    <h4>Historial de tareas</h4>
                    <span className="status-pill success">{tareasCompletadas.length}</span>
                  </div>
                  {tareasCompletadas.length === 0 ? (
                    <div className="sin-resultados"><p>Aun no hay tareas completadas.</p></div>
                  ) : tareasCompletadas.map(renderTarea)}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
