import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { tareaService } from "../services/tareaService";
import type { Hogar } from "../types/Hogar";
import type { Tarea } from "../types/Tarea";

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

function formatMemberName(usuarioId: number, currentUser?: { id: number; nombre?: string; usuario?: string }) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tú";
  return `Integrante #${usuarioId}`;
}

export default function Tareas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), tareaService.listar()])
      .then(([hogaresResult, tareasResult]) => {
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setTareas(tareasResult.status === "fulfilled" ? tareasResult.value : []);

        if (hogaresResult.status === "rejected" || tareasResult.status === "rejected") {
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

  const tareasDelHogar = useMemo(() => {
    if (!hogarActual?.tareasIds?.length) return [];
    return tareas.filter((tarea) => hogarActual.tareasIds.includes(tarea.id));
  }, [hogarActual, tareas]);

  const canManage = isHogarAdmin(hogarActual, user?.id);

  const validateForm = () => {
    if (!hogarActual) return "Debes pertenecer a un hogar para crear tareas.";
    if (!canManage) return "Solo el administrador del hogar puede asignar nuevas tareas.";
    if (form.titulo.trim().length < 4) return "El título debe tener al menos 4 caracteres.";
    if (!form.encargadoId) return "Selecciona un integrante encargado.";
    if (form.descripcion.trim().length < 10) return "La descripción debe tener al menos 10 caracteres.";
    if (!form.fecha) return "Selecciona una fecha para la tarea.";
    return "";
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
      const creada = await tareaService.crear({
        titulo: form.titulo.trim(),
        encargado: formatMemberName(encargadoId, user || undefined),
        descripcion: form.descripcion.trim(),
        fecha: form.fecha,
      });

      const hogarActualizado = await hogarService.agregarTarea(hogarActual!.id, {
        administradorId: user!.id,
        recursoId: creada.id,
      });

      setTareas((current) => [...current, creada]);
      setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      setForm(initialForm);
      setMessage("Tarea creada y asociada al hogar.");
    } catch {
      setMessage("No se pudo guardar la tarea. Revisa que los servicios estén disponibles.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/hogares")}>Mis hogares</button>
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
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Nueva tarea</h3>
            {!canManage && <p className="form-helper">Solo el administrador del hogar puede crear tareas asociadas al grupo.</p>}
            <input className="form-control" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required disabled={!canManage} />
            <select className="form-control" value={form.encargadoId} onChange={(e) => setForm({ ...form, encargadoId: e.target.value })} required disabled={!canManage}>
              <option value="">Encargado</option>
              {integrantes.map((usuarioId) => (
                <option key={usuarioId} value={usuarioId}>{formatMemberName(usuarioId, user || undefined)}</option>
              ))}
            </select>
            <textarea className="form-control" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required disabled={!canManage} />
            <input className="form-control" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required disabled={!canManage} />
            <button className="btn btn-success w-100" disabled={isSaving || !canManage}>{isSaving ? "Guardando..." : "Asignar tarea"}</button>
          </form>

          <div className="module-list">
            <h3>Tareas de {hogarActual.nombre}</h3>
            {tareasDelHogar.length === 0 ? (
              <div className="sin-resultados"><p>No hay tareas asociadas a este hogar.</p></div>
            ) : tareasDelHogar.map((tarea) => (
              <article className="module-item" key={tarea.id}>
                <h4>{tarea.titulo}</h4>
                <p>{tarea.descripcion}</p>
                <span>{tarea.encargado} · {tarea.fecha}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
