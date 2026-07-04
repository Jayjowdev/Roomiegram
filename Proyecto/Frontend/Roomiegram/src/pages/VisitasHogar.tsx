import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";
import type { EstadoVisita, Visita } from "../types/Visita";

function formatFechaVisita(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMinDatetimeLocal() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function estadoClass(estado: EstadoVisita) {
  switch (estado) {
    case "REALIZADA":
      return "success";
    case "CANCELADA":
      return "danger";
    default:
      return "";
  }
}

export default function VisitasHogar() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const hogarId = Number(id);

  const [hogar, setHogar] = useState<Hogar | null>(null);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [fechaVisita, setFechaVisita] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingVisita, setProcessingVisita] = useState<number | null>(null);

  const isAdmin = !!hogar && user?.id === hogar.usuarioAdministradorId;

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const loadData = () => {
    if (!hogarId || Number.isNaN(hogarId)) {
      setMessage("El identificador del hogar no es valido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.allSettled([
      hogarService.listar(),
      hogarService.listarVisitasPorHogar(hogarId),
      usuarioService.listar(),
    ])
      .then(([hogaresResult, visitasResult, usuariosResult]) => {
        const hogaresData = hogaresResult.status === "fulfilled" ? hogaresResult.value : [];
        const hogarEncontrado = hogaresData.find((item) => item.id === hogarId) || null;
        setHogar(hogarEncontrado);
        setVisitas(visitasResult.status === "fulfilled" ? visitasResult.value : []);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

        if (hogaresResult.status === "rejected" || visitasResult.status === "rejected") {
          setMessage("Servicio no disponible. Intenta nuevamente.");
        } else if (!hogarEncontrado) {
          setMessage("No se encontro el hogar solicitado.");
        } else {
          setMessage("");
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadData, [hogarId]);

  const visitasOrdenadas = useMemo(() => {
    return [...visitas].sort((a, b) => new Date(b.fechaVisita).getTime() - new Date(a.fechaVisita).getTime());
  }, [visitas]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!user?.id) {
      setMessage("Debes iniciar sesion para agendar una visita.");
      return;
    }
    if (!fechaVisita) {
      setMessage("Selecciona una fecha y hora para la visita.");
      return;
    }

    setIsSaving(true);
    try {
      const nueva = await hogarService.crearVisita(hogarId, {
        usuarioVisitanteId: user.id,
        fechaVisita: new Date(fechaVisita).toISOString(),
        comentarios: comentarios.trim() || undefined,
      });
      setVisitas((current) => [nueva, ...current]);
      setMessage("Visita agendada correctamente. El administrador del hogar sera notificado.");
      setFechaVisita("");
      setComentarios("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo agendar la visita.");
    } finally {
      setIsSaving(false);
    }
  };

  const actualizarEstado = async (visita: Visita, nuevoEstado: EstadoVisita) => {
    if (!user?.id || !isAdmin) {
      setMessage("Solo el administrador del hogar puede actualizar el estado de una visita.");
      return;
    }

    setProcessingVisita(visita.id);
    try {
      const actualizada = await hogarService.actualizarVisita(hogarId, visita.id, {
        estado: nuevoEstado,
        administradorId: user.id,
      });
      setVisitas((current) => current.map((item) => (item.id === actualizada.id ? actualizada : item)));
      setMessage(`Visita marcada como ${nuevoEstado.toLowerCase()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la visita.");
    } finally {
      setProcessingVisita(null);
    }
  };

  const nombreVisitante = (usuarioId: number) => {
    if (usuarioId === user?.id) return "Tu";
    const usuario = usuariosById.get(usuarioId);
    return usuario?.nombre || usuario?.usuario || `Usuario ${usuarioId}`;
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/hogares")}>
            Mis hogares
          </button>
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Visitas e inspecciones</h1>
        <p>
          {hogar
            ? `Agenda tu visita al hogar "${hogar.nombre}" y revisa su estado. Solo despues de una visita realizada podras enviar tu solicitud de ingreso.`
            : "Agenda tu visita al hogar y revisa su estado antes de solicitar ingreso."}
        </p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <section className="module-list hogares-loading-panel">
          <div className="sin-resultados"><p>Cargando visitas...</p></div>
        </section>
      ) : !hogar ? (
        <section className="module-list">
          <div className="sin-resultados"><p>No se encontro el hogar solicitado.</p></div>
        </section>
      ) : (
        <section className="module-layout hogares-layout">
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Agendar visita</h3>
            <p className="form-helper">
              Selecciona una fecha y hora para conocer el hogar. El administrador podra confirmar o cancelar la visita.
            </p>
            <label className="form-label" htmlFor="fecha-visita">
              Fecha y hora de la visita
            </label>
            <input
              id="fecha-visita"
              className="form-control"
              type="datetime-local"
              value={fechaVisita}
              min={getMinDatetimeLocal()}
              onChange={(event) => setFechaVisita(event.target.value)}
              required
            />
            <label className="form-label" htmlFor="comentarios-visita">
              Comentarios (opcional)
            </label>
            <textarea
              id="comentarios-visita"
              className="form-control"
              placeholder="Ej: preferencia horaria, preguntas sobre el hogar..."
              value={comentarios}
              onChange={(event) => setComentarios(event.target.value)}
              rows={3}
            />
            <button className="btn btn-success w-100" type="submit" disabled={isSaving}>
              {isSaving ? "Agendando..." : "Agendar visita"}
            </button>
          </form>

          <div className="module-list">
            <section className="hogares-section">
              <h3>Visitas registradas</h3>
              {visitasOrdenadas.length === 0 ? (
                <p className="empty-state">Aun no hay visitas registradas para este hogar.</p>
              ) : (
                visitasOrdenadas.map((visita) => (
                  <article className="module-item hogar-card" key={visita.id}>
                    <div className="section-heading-row">
                      <div>
                        <h4>{formatFechaVisita(visita.fechaVisita)}</h4>
                        <p>
                          Visitante: <strong>{nombreVisitante(visita.usuarioVisitanteId)}</strong>
                        </p>
                        {visita.comentarios && <p className="form-helper">{visita.comentarios}</p>}
                      </div>
                      <span className={`status-pill ${estadoClass(visita.estado)}`}>
                        {visita.estado === "PENDIENTE" ? "Pendiente" : visita.estado === "REALIZADA" ? "Realizada" : "Cancelada"}
                      </span>
                    </div>

                    {isAdmin && visita.estado === "PENDIENTE" && (
                      <div className="item-actions">
                        <button
                          className="btn btn-outline-success btn-sm"
                          type="button"
                          disabled={processingVisita === visita.id}
                          onClick={() => actualizarEstado(visita, "REALIZADA")}
                        >
                          {processingVisita === visita.id ? "Actualizando..." : "Marcar realizada"}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          type="button"
                          disabled={processingVisita === visita.id}
                          onClick={() => actualizarEstado(visita, "CANCELADA")}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
