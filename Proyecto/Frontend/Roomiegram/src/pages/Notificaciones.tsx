import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { comprobanteService } from "../services/comprobanteService";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import { isPremiumHogar, membresiaService, type PlanId } from "../services/membresiaService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import { visitaService } from "../services/visitaService";
import type { Comprobante, HogarCuenta, Notificacion } from "../types/Backend";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import type { VisitaHogar } from "../types/VisitaHogar";
import {
  aceptarInvitacionHogar,
  aceptarSolicitudIngreso,
  rechazarInvitacionHogar,
  rechazarSolicitudIngreso,
} from "../utils/notificacionActions";

const filterDefaults = {
  busqueda: "",
  tipo: "todos",
  estado: "todos",
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("es-CL") : "Sin fecha";
}

function normalize(value?: string | number) {
  return String(value ?? "").toLowerCase().trim();
}

function formatLabel(value: string) {
  if (value === "INTERES_ROOMIE") return "Interés roomie";
  if (value === "INVITACION_HOGAR") return "Invitación hogar";
  if (value === "VISITA_HOGAR") return "Visita hogar";
  if (value === "TAREA_HOGAR") return "Tarea hogar";
  if (value === "CUENTA_HOGAR") return "Cuenta del hogar";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTelefonoContacto(telefono?: string) {
  const value = telefono?.trim();
  return value || "Teléfono no informado";
}

function getReadHistoryKey(userId?: number) {
  return userId ? `roomiegram:notificaciones-leidas:${userId}` : "";
}

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return hogar.integrantesIds?.includes(userId) || hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId;
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [gastos, setGastos] = useState<HogarCuenta[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [visitas, setVisitas] = useState<VisitaHogar[]>([]);
  const [filters, setFilters] = useState(filterDefaults);
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [readHistory, setReadHistory] = useState<Notificacion[]>([]);
  const [alternativeForms, setAlternativeForms] = useState<Record<number, { fecha: string; hora: string; mensaje: string }>>({});
  const [planesIntegrantes, setPlanesIntegrantes] = useState<Record<number, PlanId>>({});

  useEffect(() => {
    Promise.allSettled([
      notificacionService.listar(),
      hogarService.listar(),
      gastoService.listar(),
      comprobanteService.listar(),
      usuarioService.listar(),
      publicacionService.listar(),
    ])
      .then(([notificacionesResult, hogaresResult, gastosResult, comprobantesResult, usuariosResult, publicacionesResult]) => {
        if (notificacionesResult.status === "fulfilled") setNotificaciones(notificacionesResult.value);
        if (hogaresResult.status === "fulfilled") setHogares(hogaresResult.value);
        if (gastosResult.status === "fulfilled") setGastos(gastosResult.value);
        if (comprobantesResult.status === "fulfilled") setComprobantes(comprobantesResult.value);
        if (usuariosResult.status === "fulfilled") setUsuarios(usuariosResult.value);
        if (publicacionesResult.status === "fulfilled") setPublicaciones(publicacionesResult.value);
        setMessage("");
        if ([notificacionesResult, hogaresResult, gastosResult, comprobantesResult, usuariosResult, publicacionesResult].some((result) => result.status === "rejected")) {
          setMessage("Algunos datos de contexto no se pudieron cargar.");
        }
      })
      .catch(() => setMessage("Servicio no disponible. Intenta nuevamente."));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setVisitas([]);
      return;
    }

    visitaService
      .listarPorUsuario(user.id)
      .then(setVisitas)
      .catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    const key = getReadHistoryKey(user?.id);
    if (!key) {
      setReadHistory([]);
      return;
    }

    try {
      const stored = window.localStorage.getItem(key);
      setReadHistory(stored ? JSON.parse(stored) : []);
    } catch {
      setReadHistory([]);
    }
  }, [user?.id]);

  const guardarEnHistorial = (notificacion: Notificacion, estado: string) => {
    const key = getReadHistoryKey(user?.id);
    if (!key) return;

    const item = { ...notificacion, estado };
    setReadHistory((current) => {
      const next = [item, ...current.filter((historial) => historial.id !== notificacion.id)].slice(0, 50);
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const notificacionesVisibles = useMemo(() => {
    const idsActivos = new Set(notificaciones.map((notificacion) => notificacion.id).filter(Boolean));
    return [
      ...notificaciones,
      ...readHistory.filter((notificacion) => !notificacion.id || !idsActivos.has(notificacion.id)),
    ];
  }, [notificaciones, readHistory]);

  const hogarActual = useMemo(() => {
    return hogares.find((hogar) => userBelongsToHogar(hogar, user?.id));
  }, [hogares, user?.id]);

  const integrantes = useMemo(() => {
    if (!hogarActual) return [];
    return [...new Set([hogarActual.usuarioAdministradorId, hogarActual.usuarioCreadorId, ...(hogarActual.integrantesIds || [])])].filter(
      (id): id is number => typeof id === "number" && id > 0
    );
  }, [hogarActual]);

  useEffect(() => {
    if (!integrantes.length) {
      setPlanesIntegrantes({});
      return;
    }

    let isMounted = true;

    Promise.allSettled(integrantes.map((usuarioId) => membresiaService.obtenerActiva(usuarioId)))
      .then((results) => {
        if (!isMounted) return;

        const planes = results.reduce<Record<number, PlanId>>((acc, result, index) => {
          const usuarioId = integrantes[index];
          if (result.status === "fulfilled") acc[usuarioId] = result.value.plan;
          return acc;
        }, {});

        setPlanesIntegrantes(planes);
      });

    return () => {
      isMounted = false;
    };
  }, [integrantes]);

  const tienePremiumHogar = integrantes.some((usuarioId) => isPremiumHogar(planesIntegrantes[usuarioId]));

  const misNotificaciones = useMemo(() => {
    if (!user?.id) return [];
    return notificacionesVisibles.filter((notificacion) => notificacion.usuarioReceptorId === user.id);
  }, [notificacionesVisibles, user?.id]);

  const invitacionesPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "INVITACION_HOGAR" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const tareasPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "TAREA_HOGAR" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const cuentasPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "CUENTA_HOGAR" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const interesesPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "INTERES_ROOMIE" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const visitasPendientes = useMemo(() => {
    return misNotificaciones.filter((notificacion) =>
      notificacion.tipo === "VISITA_HOGAR" && notificacion.estado === "PENDIENTE",
    );
  }, [misNotificaciones]);

  const getHogarNotificacion = (notificacion: Notificacion) => {
    return hogares.find((hogar) => hogar.id === notificacion.hogarId);
  };

  const getUsuario = (usuarioId: number) => {
    return usuarios.find((usuario) => usuario.id === usuarioId);
  };

  const getPublicacionDelHogar = (hogar?: Hogar) => {
    const publicacionId = hogar?.publicacionIds?.[0];
    if (!publicacionId) return undefined;
    return publicaciones.find((publicacion) => publicacion.id === publicacionId);
  };

  const getComprobante = (notificacion: Notificacion) => {
    return comprobantes.find((comprobante) => comprobante.id === notificacion.referenciaId);
  };

  const getGastoComprobante = (comprobante?: Comprobante) => {
    return gastos.find((gasto) => gasto.id === comprobante?.hogarCuentaId);
  };

  const getVisita = (notificacion: Notificacion) => {
    return visitas.find((visita) => visita.id === notificacion.referenciaId);
  };

  const getPublicacionVisita = (visita?: VisitaHogar) => {
    return publicaciones.find((publicacion) => publicacion.id === visita?.publicacionId);
  };

  const getNombreUsuario = (usuarioId?: number) => {
    const usuario = usuarioId ? getUsuario(usuarioId) : undefined;
    return usuario?.nombre || usuario?.usuario || (usuarioId ? `Usuario #${usuarioId}` : "Usuario");
  };

  const enviarCorreoVisitaBestEffort = async (
    promise: Promise<{ enviado: boolean; mensaje: string }>,
    contexto: string,
  ) => {
    try {
      const resultado = await promise;
      if (!resultado.enviado) {
        console.warn(resultado.mensaje);
      }
    } catch (error) {
      console.warn(`No se pudo enviar el correo de ${contexto}.`, error);
    }
  };

  const esAdminDelHogar = (hogar?: Hogar) => {
    return !!user?.id && !!hogar && (
      hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id
    );
  };

  const esSolicitudRecibida = (notificacion: Notificacion) => {
    const hogar = getHogarNotificacion(notificacion);
    return esAdminDelHogar(hogar) && hogar?.solicitudesPendientesIds?.includes(notificacion.usuarioEmisorId);
  };

  const getNotificationContext = (notificacion: Notificacion) => {
    const hogar = getHogarNotificacion(notificacion);
    const emisor = getUsuario(notificacion.usuarioEmisorId);
    const publicacion = getPublicacionDelHogar(hogar);
    const esSolicitud = esSolicitudRecibida(notificacion);

    return {
      hogar,
      emisor,
      publicacion,
      esSolicitud,
      nombreEmisor: emisor?.nombre || emisor?.usuario || `Usuario #${notificacion.usuarioEmisorId}`,
    };
  };

  const buildInterestParams = (notificacion: Notificacion) => {
    const params = new URLSearchParams({
      from: "notificaciones",
      tipoAccion: "interes",
      usuarioId: String(notificacion.usuarioEmisorId),
    });

    if (notificacion.id) params.set("notificacionId", String(notificacion.id));
    if (notificacion.referenciaId) params.set("referenciaId", String(notificacion.referenciaId));

    return params.toString();
  };

  const buildNotificationParams = (notificacion: Notificacion, publicacion?: Publicacion, esSolicitud?: boolean) => {
    const params = new URLSearchParams({
      from: "notificaciones",
      tipoAccion: esSolicitud ? "solicitud" : "invitacion",
      hogarId: String(notificacion.hogarId),
      usuarioId: String(notificacion.usuarioEmisorId),
    });

    if (notificacion.id) params.set("notificacionId", String(notificacion.id));
    if (publicacion?.id) params.set("publicacionId", String(publicacion.id));

    return params.toString();
  };

  const tiposDisponibles = useMemo(
    () => [...new Set(misNotificaciones.map((notificacion) => notificacion.tipo).filter(Boolean))],
    [misNotificaciones],
  );

  const estadosDisponibles = useMemo(
    () => [...new Set(misNotificaciones.map((notificacion) => notificacion.estado).filter(Boolean))],
    [misNotificaciones],
  );

  const notificacionesFiltradas = useMemo(() => {
    const termino = normalize(filters.busqueda);

    return misNotificaciones.filter((notificacion) => {
      const yaEstaDestacada =
        notificacion.estado === "PENDIENTE" &&
        (notificacion.tipo === "INVITACION_HOGAR" || notificacion.tipo === "VISITA_HOGAR" || notificacion.tipo === "TAREA_HOGAR" || notificacion.tipo === "INTERES_ROOMIE" || notificacion.tipo === "CUENTA_HOGAR");

      if (yaEstaDestacada) return false;

      const coincideTipo = filters.tipo === "todos" || notificacion.tipo === filters.tipo;
      const coincideEstado = filters.estado === "todos" || notificacion.estado === filters.estado;
      const contenido = [
        notificacion.titulo,
        notificacion.mensaje,
        notificacion.tipo,
        notificacion.estado,
        notificacion.hogarId,
        formatDate(notificacion.fechaCreacion),
      ].map(normalize).join(" ");

      return coincideTipo && coincideEstado && (!termino || contenido.includes(termino));
    });
  }, [filters, misNotificaciones]);

  const hasActiveFilters =
    Boolean(filters.busqueda.trim()) || filters.tipo !== "todos" || filters.estado !== "todos";

  const notificacionesNoLeidas = useMemo(
    () => notificacionesFiltradas.filter((notificacion) => notificacion.estado === "PENDIENTE"),
    [notificacionesFiltradas],
  );

  const notificacionesLeidas = useMemo(
    () => notificacionesFiltradas.filter((notificacion) => notificacion.estado !== "PENDIENTE"),
    [notificacionesFiltradas],
  );

  const aceptarNotificacionPendiente = async (notificacion: Notificacion) => {
    if (!user?.id || !notificacion.id) return;
    const hogar = getHogarNotificacion(notificacion);

    try {
      setProcessingId(notificacion.id);

      if (esSolicitudRecibida(notificacion)) {
        const resultado = await aceptarSolicitudIngreso({
          hogarId: notificacion.hogarId,
          solicitanteId: notificacion.usuarioEmisorId,
          administradorId: user.id,
          notificacionId: notificacion.id,
          hogarNombre: hogar?.nombre,
        });
        if (resultado.hogar) {
          setHogares((current) => current.map((item) => item.id === resultado.hogar?.id ? resultado.hogar : item));
        }
        setMessage(resultado.message);
      } else {
        const resultado = await aceptarInvitacionHogar({
          hogarId: notificacion.hogarId,
          usuarioId: user.id,
          administradorId: hogar?.usuarioAdministradorId || notificacion.usuarioEmisorId,
          notificacionId: notificacion.id,
        });
        if (resultado.hogar) {
          setHogares((current) => current.map((item) => item.id === resultado.hogar?.id ? resultado.hogar : item));
        }
        setMessage(resultado.message);
      }

      guardarEnHistorial(notificacion, "ACEPTADA");
      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aceptar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const rechazarNotificacionPendiente = async (notificacion: Notificacion) => {
    if (!notificacion.id) return;

    try {
      setProcessingId(notificacion.id);
      if (user?.id && esSolicitudRecibida(notificacion)) {
        const hogar = getHogarNotificacion(notificacion);
        const resultado = await rechazarSolicitudIngreso({
          hogarId: notificacion.hogarId,
          solicitanteId: notificacion.usuarioEmisorId,
          administradorId: user.id,
          notificacionId: notificacion.id,
          hogarNombre: hogar?.nombre,
        });
        if (resultado.hogar) {
          setHogares((current) => current.map((item) => item.id === resultado.hogar?.id ? resultado.hogar : item));
        }
      } else {
        await rechazarInvitacionHogar({ notificacionId: notificacion.id });
      }

      guardarEnHistorial(notificacion, "RECHAZADA");
      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
      setMessage(esSolicitudRecibida(notificacion) ? "Solicitud rechazada." : "Invitación rechazada.");
    } catch {
      setMessage("No se pudo rechazar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const actualizarVisitaLocal = (visita: VisitaHogar) => {
    setVisitas((current) => [visita, ...current.filter((item) => item.id !== visita.id)]);
  };

  const cerrarNotificacionVisita = async (notificacion: Notificacion, estado: string, mensaje: string) => {
    if (notificacion.id) {
      await notificacionService.eliminar(notificacion.id);
    }
    guardarEnHistorial(notificacion, estado);
    setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
    setMessage(mensaje);
  };

  const aceptarVisitaPendiente = async (notificacion: Notificacion) => {
    if (!user?.id || !notificacion.id) return;
    const visita = getVisita(notificacion);
    if (!visita?.id) {
      setMessage("No se pudo encontrar la visita asociada.");
      return;
    }

    try {
      setProcessingId(notificacion.id);
      const actualizada = await visitaService.aceptar(visita.id, user.id);
      actualizarVisitaLocal(actualizada);
      const publicacion = getPublicacionVisita(actualizada);
      await enviarCorreoVisitaBestEffort(usuarioService.enviarCorreoVisitaResuelta({
        usuarioInteresadoId: actualizada.interesadoId,
        anfitrionId: user.id,
        publicacionTitulo: publicacion?.titulo,
        fechaHora: formatDate(actualizada.fechaHoraPropuesta),
        aceptada: true,
      }), "visita aceptada");
      await cerrarNotificacionVisita(notificacion, "ACEPTADA", "Visita aceptada. Se avisó al interesado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aceptar la visita.");
    } finally {
      setProcessingId(null);
    }
  };

  const rechazarVisitaPendiente = async (notificacion: Notificacion) => {
    if (!user?.id || !notificacion.id) return;
    const visita = getVisita(notificacion);
    if (!visita?.id) {
      setMessage("No se pudo encontrar la visita asociada.");
      return;
    }

    try {
      setProcessingId(notificacion.id);
      const actualizada = visita.estado === "PROPUESTA_ALTERNATIVA" && visita.interesadoId === user.id
        ? await visitaService.responderAlternativa(visita.id, user.id, false)
        : await visitaService.rechazar(visita.id, user.id);
      actualizarVisitaLocal(actualizada);
      const publicacion = getPublicacionVisita(actualizada);
      if (visita.estado === "PROPUESTA_ALTERNATIVA" && visita.interesadoId === user.id) {
        await enviarCorreoVisitaBestEffort(usuarioService.enviarCorreoVisitaAlternativaResuelta({
          usuarioAnfitrionId: actualizada.anfitrionId,
          interesadoId: user.id,
          publicacionTitulo: publicacion?.titulo,
          fechaHora: formatDate(actualizada.fechaHoraAlternativa || actualizada.fechaHoraPropuesta),
          aceptada: false,
        }), "respuesta a horario alternativo");
      } else {
        await enviarCorreoVisitaBestEffort(usuarioService.enviarCorreoVisitaResuelta({
          usuarioInteresadoId: actualizada.interesadoId,
          anfitrionId: user.id,
          publicacionTitulo: publicacion?.titulo,
          fechaHora: formatDate(actualizada.fechaHoraPropuesta),
          aceptada: false,
        }), "visita rechazada");
      }
      await cerrarNotificacionVisita(notificacion, "RECHAZADA", "Visita rechazada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo rechazar la visita.");
    } finally {
      setProcessingId(null);
    }
  };

  const proponerAlternativaVisita = async (notificacion: Notificacion) => {
    if (!user?.id || !notificacion.id) return;
    const visita = getVisita(notificacion);
    const form = alternativeForms[notificacion.id];
    if (!visita?.id) {
      setMessage("No se pudo encontrar la visita asociada.");
      return;
    }
    if (!form?.fecha || !form?.hora) {
      setMessage("Indica fecha y hora para proponer otro horario.");
      return;
    }

    const fechaHoraAlternativa = `${form.fecha}T${form.hora}:00`;
    if (new Date(fechaHoraAlternativa).getTime() <= Date.now()) {
      setMessage("El horario alternativo debe ser futuro.");
      return;
    }

    try {
      setProcessingId(notificacion.id);
      const actualizada = await visitaService.proponerAlternativa(
        visita.id,
        user.id,
        fechaHoraAlternativa,
        form.mensaje,
      );
      actualizarVisitaLocal(actualizada);
      const publicacion = getPublicacionVisita(actualizada);
      await enviarCorreoVisitaBestEffort(usuarioService.enviarCorreoVisitaAlternativa({
        usuarioInteresadoId: actualizada.interesadoId,
        anfitrionId: user.id,
        publicacionTitulo: publicacion?.titulo,
        fechaHoraAlternativa: formatDate(actualizada.fechaHoraAlternativa),
        mensaje: form.mensaje,
      }), "horario alternativo");
      await cerrarNotificacionVisita(notificacion, "PROPUESTA_ALTERNATIVA", "Horario alternativo enviado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo proponer otro horario.");
    } finally {
      setProcessingId(null);
    }
  };

  const aceptarAlternativaVisita = async (notificacion: Notificacion) => {
    if (!user?.id || !notificacion.id) return;
    const visita = getVisita(notificacion);
    if (!visita?.id) {
      setMessage("No se pudo encontrar la visita asociada.");
      return;
    }

    try {
      setProcessingId(notificacion.id);
      const actualizada = await visitaService.responderAlternativa(visita.id, user.id, true);
      actualizarVisitaLocal(actualizada);
      const publicacion = getPublicacionVisita(actualizada);
      await enviarCorreoVisitaBestEffort(usuarioService.enviarCorreoVisitaAlternativaResuelta({
        usuarioAnfitrionId: actualizada.anfitrionId,
        interesadoId: user.id,
        publicacionTitulo: publicacion?.titulo,
        fechaHora: formatDate(actualizada.fechaHoraPropuesta),
        aceptada: true,
      }), "respuesta a horario alternativo");
      await cerrarNotificacionVisita(notificacion, "ACEPTADA", "Horario alternativo aceptado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aceptar el horario alternativo.");
    } finally {
      setProcessingId(null);
    }
  };

  const cerrarTareaPendiente = async (notificacion: Notificacion) => {
    if (!notificacion.id) return;

    try {
      setProcessingId(notificacion.id);
      await notificacionService.eliminar(notificacion.id);
      guardarEnHistorial(notificacion, "LEIDA");
      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
      setMessage("Notificación marcada como leída y guardada en historial.");
    } catch {
      setMessage("No se pudo actualizar la notificación de tarea.");
    } finally {
      setProcessingId(null);
    }
  };

  const descartarNotificacion = async (notificacion: Notificacion) => {
    if (!notificacion.id) return;

    try {
      setProcessingId(notificacion.id);
      await notificacionService.eliminar(notificacion.id);
      guardarEnHistorial(notificacion, "LEIDA");
      setNotificaciones((current) => current.filter((item) => item.id !== notificacion.id));
      setMessage("Notificación guardada en historial.");
    } catch {
      setMessage("No se pudo completar la acción. Intenta nuevamente.");
    } finally {
      setProcessingId(null);
    }
  };

  const renderAviso = (notificacion: Notificacion) => {
    const esInteres = notificacion.tipo === "INTERES_ROOMIE";
    const esVisita = notificacion.tipo === "VISITA_HOGAR";
    const emisor = esInteres ? getUsuario(notificacion.usuarioEmisorId) : undefined;
    const visita = esVisita ? getVisita(notificacion) : undefined;
    const publicacionVisita = getPublicacionVisita(visita);
    const soyAnfitrionVisita = !!user?.id && visita?.anfitrionId === user.id;
    const soyInteresadoVisita = !!user?.id && visita?.interesadoId === user.id;

    return (
      <article className="module-item" key={notificacion.id || `${notificacion.titulo}-${notificacion.fechaCreacion}`}>
        <h4>{notificacion.titulo}</h4>
        <p>{notificacion.mensaje}</p>
        {esInteres && (
          <div className="notification-context-grid mt-2">
            <span><strong>Persona:</strong> {emisor?.nombre || emisor?.usuario || `Usuario #${notificacion.usuarioEmisorId}`}</span>
            <span><strong>Teléfono:</strong> {getTelefonoContacto(emisor?.telefono)}</span>
          </div>
        )}
        {esVisita && visita && (
          <div className="notification-context-grid mt-2">
            <span><strong>Publicación:</strong> {publicacionVisita?.titulo || `#${visita.publicacionId}`}</span>
            <span><strong>Interesado:</strong> {getNombreUsuario(visita.interesadoId)}</span>
            <span><strong>Anfitrion:</strong> {getNombreUsuario(visita.anfitrionId)}</span>
            <span><strong>Dí­a y hora:</strong> {formatDate(visita.fechaHoraPropuesta)}</span>
            <span><strong>Estado visita:</strong> {formatLabel(visita.estado)}</span>
          </div>
        )}
        <span>{formatLabel(notificacion.tipo)} - {formatLabel(notificacion.estado)} - {formatDate(notificacion.fechaCreacion)}</span>
        {esVisita && visita && (
          <div className="dashboard-actions mt-3">
            {soyAnfitrionVisita && (
              <button
                className="btn btn-outline-success btn-sm"
                type="button"
                onClick={() => navigate(`/perfil-publico/${visita.interesadoId}`)}
              >
                Ver perfil del interesado
              </button>
            )}
            {soyInteresadoVisita && (
              <button
                className="btn btn-outline-success btn-sm"
                type="button"
                onClick={() => navigate(`/perfil-publico/${visita.anfitrionId}`)}
              >
                Ver perfil del anfitrion
              </button>
            )}
            {publicacionVisita && (
              <button
                className="btn btn-outline-success btn-sm"
                type="button"
                onClick={() => navigate(`/detalle-publicacion/${publicacionVisita.id}`)}
              >
                Ver publicacion
              </button>
            )}
          </div>
        )}
        {esInteres && notificacion.estado === "PENDIENTE" && (
          <div className="dashboard-actions mt-3">
            <button
              className="btn btn-outline-success btn-sm"
              type="button"
              onClick={() => navigate(`/perfil-publico/${notificacion.usuarioEmisorId}?${buildInterestParams(notificacion)}`)}
            >
              Ver perfil
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              type="button"
              disabled={processingId === notificacion.id}
              onClick={() => descartarNotificacion(notificacion)}
            >
              Descartar
            </button>
          </div>
        )}
        {!esInteres && !esVisita && notificacion.estado === "PENDIENTE" && (
          <div className="dashboard-actions mt-3">
            <button
              className="btn btn-outline-danger btn-sm"
              type="button"
              disabled={processingId === notificacion.id}
              onClick={() => descartarNotificacion(notificacion)}
            >
              Descartar
            </button>
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
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Notificaciones</h1>
        <p>Revisa invitaciones, solicitudes y avisos importantes de convivencia.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-list mb-4">
        <h3>Tareas y avisos pendientes</h3>
        {!tienePremiumHogar ? (
          <div className="sin-resultados">
            <p>Las tareas del hogar requieren Premium Hogar grupal activo.</p>
          </div>
        ) : tareasPendientes.length === 0 ? (
          <div className="sin-resultados"><p>No tienes tareas asignadas pendientes.</p></div>
        ) : (
          tareasPendientes.map((notificacion) => (
            <article className="module-item notification-highlight" key={notificacion.id || notificacion.titulo}>
              <h4>{notificacion.titulo}</h4>
              <p>{notificacion.mensaje}</p>
              <span>{formatLabel(notificacion.tipo)} - {formatDate(notificacion.fechaCreacion)}</span>
              <div className="dashboard-actions mt-3">
                <button className="btn btn-success btn-sm" onClick={() => navigate("/tareas")}>
                  Ver tareas
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  disabled={processingId === notificacion.id}
                  onClick={() => cerrarTareaPendiente(notificacion)}
                >
                  {processingId === notificacion.id ? "Actualizando..." : "Marcar como leída"}
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="module-list mb-4">
        <h3>Comprobantes y cuentas del hogar</h3>
        {!tienePremiumHogar ? (
          <div className="sin-resultados">
            <p>Los comprobantes y cuentas del hogar requieren Premium Hogar grupal activo.</p>
          </div>
        ) : cuentasPendientes.length === 0 ? (
          <div className="sin-resultados"><p>No tienes comprobantes nuevos por revisar.</p></div>
        ) : (
          cuentasPendientes.map((notificacion) => {
            const comprobante = getComprobante(notificacion);
            const gasto = getGastoComprobante(comprobante);

            return (
              <article className="module-item notification-highlight" key={notificacion.id || notificacion.titulo}>
                <h4>{notificacion.titulo}</h4>
                <p>{notificacion.mensaje}</p>
                <span>
                  {gasto?.descripcion || "Gasto del hogar"} - {comprobante?.nombreArchivo || `Comprobante #${notificacion.referenciaId || "sin referencia"}`} - {formatDate(notificacion.fechaCreacion)}
                </span>
                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => navigate(`/comprobantes${notificacion.referenciaId ? `?comprobante=${notificacion.referenciaId}` : ""}`)}
                  >
                    Ver comprobante
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm"
                    disabled={processingId === notificacion.id}
                    onClick={() => descartarNotificacion(notificacion)}
                  >
                    {processingId === notificacion.id ? "Actualizando..." : "Marcar como revisado"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="module-list mb-4">
        <h3>Visitas pendientes</h3>
        {visitasPendientes.length === 0 ? (
          <div className="sin-resultados"><p>No tienes visitas pendientes por coordinar.</p></div>
        ) : (
          visitasPendientes.map((notificacion) => {
            const visita = getVisita(notificacion);
            const publicacion = getPublicacionVisita(visita);
            const form = notificacion.id ? alternativeForms[notificacion.id] || { fecha: "", hora: "", mensaje: "" } : { fecha: "", hora: "", mensaje: "" };
            const soyAnfitrion = !!user?.id && visita?.anfitrionId === user.id;
            const soyInteresado = !!user?.id && visita?.interesadoId === user.id;
            const esAlternativa = visita?.estado === "PROPUESTA_ALTERNATIVA";
            const interesadoNombre = getNombreUsuario(visita?.interesadoId);
            const anfitrionNombre = getNombreUsuario(visita?.anfitrionId);

            return (
              <article className="module-item notification-context-card" key={notificacion.id || notificacion.titulo}>
                <div className="notification-context-head">
                  <div className="notification-avatar">V</div>
                  <div>
                    <span className="eyebrow">Visita hogar</span>
                    <h4>{notificacion.titulo}</h4>
                    <p>{notificacion.mensaje}</p>
                  </div>
                </div>

                <div className="notification-context-grid">
                  <span><strong>Publicación:</strong> {publicacion?.titulo || `#${visita?.publicacionId || notificacion.referenciaId}`}</span>
                  <span><strong>Interesado:</strong> {interesadoNombre}</span>
                  <span><strong>Anfitrion:</strong> {anfitrionNombre}</span>
                  <span><strong>Hogar:</strong> {getHogarNotificacion(notificacion)?.nombre || `#${notificacion.hogarId}`}</span>
                  <span><strong>Horario solicitado:</strong> {formatDate(visita?.fechaHoraPropuesta)}</span>
                  <span><strong>Estado:</strong> {visita?.estado ? formatLabel(visita.estado) : "Sin detalle"}</span>
                  {visita?.fechaHoraAlternativa && (
                    <span><strong>Horario alternativo:</strong> {formatDate(visita.fechaHoraAlternativa)}</span>
                  )}
                </div>

                {soyAnfitrion && visita?.estado === "PENDIENTE" && (
                  <div className="module-form compact-contact mt-3">
                    <p className="form-helper">Puedes aceptar, rechazar o proponer otro horario.</p>
                    <div className="form-row">
                      <input
                        className="form-control"
                        type="date"
                        value={form.fecha}
                        onChange={(event) => notificacion.id && setAlternativeForms((current) => ({
                          ...current,
                          [notificacion.id!]: { ...form, fecha: event.target.value },
                        }))}
                      />
                      <input
                        className="form-control"
                        type="time"
                        value={form.hora}
                        onChange={(event) => notificacion.id && setAlternativeForms((current) => ({
                          ...current,
                          [notificacion.id!]: { ...form, hora: event.target.value },
                        }))}
                      />
                    </div>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Mensaje opcional para el nuevo horario"
                      value={form.mensaje}
                      onChange={(event) => notificacion.id && setAlternativeForms((current) => ({
                        ...current,
                        [notificacion.id!]: { ...form, mensaje: event.target.value },
                      }))}
                    />
                  </div>
                )}

                <div className="dashboard-actions mt-3">
                  {soyAnfitrion && visita?.interesadoId && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => navigate(`/perfil-publico/${visita.interesadoId}`)}
                    >
                      Ver perfil del interesado
                    </button>
                  )}
                  {soyInteresado && visita?.anfitrionId && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => navigate(`/perfil-publico/${visita.anfitrionId}`)}
                    >
                      Ver perfil del anfitrion
                    </button>
                  )}
                  {publicacion && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => navigate(`/detalle-publicacion/${publicacion.id}`)}
                    >
                      Ver publicación
                    </button>
                  )}
                  {soyAnfitrion && visita?.estado === "PENDIENTE" && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        disabled={processingId === notificacion.id}
                        onClick={() => aceptarVisitaPendiente(notificacion)}
                      >
                        Aceptar visita
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm"
                        disabled={processingId === notificacion.id}
                        onClick={() => proponerAlternativaVisita(notificacion)}
                      >
                        Proponer horario
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={processingId === notificacion.id}
                        onClick={() => rechazarVisitaPendiente(notificacion)}
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {soyInteresado && esAlternativa && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        disabled={processingId === notificacion.id}
                        onClick={() => aceptarAlternativaVisita(notificacion)}
                      >
                        Aceptar nuevo horario
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={processingId === notificacion.id}
                        onClick={() => rechazarVisitaPendiente(notificacion)}
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {visita && visita.estado !== "PENDIENTE" && !esAlternativa && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      disabled={processingId === notificacion.id}
                      onClick={() => descartarNotificacion(notificacion)}
                    >
                      Marcar como revisado
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="module-list mb-4">
        <h3>Solicitudes e invitaciones pendientes</h3>
        {invitacionesPendientes.length === 0 ? (
          <div className="sin-resultados"><p>No tienes solicitudes pendientes.</p></div>
        ) : (
          invitacionesPendientes.map((notificacion) => {
            const { esSolicitud, hogar, emisor, publicacion, nombreEmisor } = getNotificationContext(notificacion);

            return (
              <article className="module-item notification-context-card" key={notificacion.id || notificacion.titulo}>
                <div className="notification-context-head">
                  <div className="notification-avatar">
                    {(emisor?.nombre || emisor?.usuario || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="eyebrow">{esSolicitud ? "Solicitud de ingreso" : "Invitación recibida"}</span>
                    <h4>{esSolicitud ? `${nombreEmisor} quiere unirse` : `${nombreEmisor} te invitó a un hogar`}</h4>
                    <p>{notificacion.mensaje}</p>
                  </div>
                </div>

                <div className="notification-context-grid">
                  <span><strong>Persona:</strong> {nombreEmisor}</span>
                  <span><strong>Hogar:</strong> {hogar?.nombre || `#${notificacion.hogarId}`}</span>
                  <span><strong>Fecha:</strong> {formatDate(notificacion.fechaCreacion)}</span>
                  <span><strong>Estado:</strong> {formatLabel(notificacion.estado)}</span>
                  {publicacion && <span><strong>Publicación:</strong> {publicacion.titulo || "Casa disponible"}</span>}
                </div>

                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(`/perfil-publico/${notificacion.usuarioEmisorId}?${buildNotificationParams(notificacion, publicacion, esSolicitud)}`)}
                  >
                    Ver perfil
                  </button>
                  {publicacion && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => navigate(`/detalle-publicacion/${publicacion.id}?${buildNotificationParams(notificacion, publicacion, esSolicitud)}`)}
                    >
                      Ver publicación de casa
                    </button>
                  )}
                  <button
                    className="btn btn-success btn-sm"
                    disabled={processingId === notificacion.id}
                    onClick={() => aceptarNotificacionPendiente(notificacion)}
                  >
                    {processingId === notificacion.id ? "Aceptando..." : esSolicitud ? "Aceptar solicitud" : "Aceptar invitación"}
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    disabled={processingId === notificacion.id}
                    onClick={() => rechazarNotificacionPendiente(notificacion)}
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {interesesPendientes.length > 0 && (
        <section className="module-list mb-4">
          <h3>Intereses recibidos</h3>
          {interesesPendientes.map((notificacion) => {
            const emisor = getUsuario(notificacion.usuarioEmisorId);
            const nombreEmisor = emisor?.nombre || emisor?.usuario || `Usuario #${notificacion.usuarioEmisorId}`;

            return (
              <article className="module-item notification-interest-card" key={notificacion.id || notificacion.titulo}>
                <div className="notification-context-head">
                  <div className="notification-avatar">
                    {nombreEmisor.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="eyebrow">Interés recibido</span>
                    <h4>Esta notificación pertenece a una función que ya no está activa.</h4>
                    <p>{nombreEmisor} mostró interés en conectar contigo. Puedes revisar su perfil o descartar este aviso.</p>
                  </div>
                </div>

                <div className="notification-context-grid">
                  <span><strong>Persona:</strong> {nombreEmisor}</span>
                  <span><strong>Teléfono:</strong> {getTelefonoContacto(emisor?.telefono)}</span>
                  <span><strong>Fecha:</strong> {formatDate(notificacion.fechaCreacion)}</span>
                  <span><strong>Estado:</strong> {formatLabel(notificacion.estado)}</span>
                </div>

                <div className="dashboard-actions mt-3">
                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={() => navigate(`/perfil-publico/${notificacion.usuarioEmisorId}?${buildInterestParams(notificacion)}`)}
                  >
                    Ver perfil
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    type="button"
                    disabled={processingId === notificacion.id}
                    onClick={() => descartarNotificacion(notificacion)}
                  >
                    Descartar
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="module-list">
        <h3>Mis avisos</h3>
        <div className="notification-filters">
          <input
            className="form-control"
            placeholder="Buscar por título, mensaje, hogar o fecha"
            value={filters.busqueda}
            onChange={(e) => setFilters((current) => ({ ...current, busqueda: e.target.value }))}
          />
          <div className="form-row">
            <select
              className="form-control"
              value={filters.tipo}
              onChange={(e) => setFilters((current) => ({ ...current, tipo: e.target.value }))}
            >
              <option value="todos">Todos los tipos</option>
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>{formatLabel(tipo)}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={filters.estado}
              onChange={(e) => setFilters((current) => ({ ...current, estado: e.target.value }))}
            >
              <option value="todos">Todos los estados</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>{formatLabel(estado)}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-actions">
            <span className="empty-state">
              {notificacionesFiltradas.length} de {misNotificaciones.length} avisos
            </span>
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setFilters(filterDefaults)}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {misNotificaciones.length === 0 ? (
          <div className="sin-resultados"><p>No tienes notificaciones por ahora.</p></div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="sin-resultados"><p>No se encontraron avisos con esos filtros.</p></div>
        ) : (
          <>
            <div className="history-section">
              <div className="section-heading-row">
                <h4>No leídas</h4>
                <span className="status-pill">{notificacionesNoLeidas.length}</span>
              </div>
              {notificacionesNoLeidas.length === 0 ? (
                <div className="sin-resultados"><p>No hay avisos no leídos en esta vista.</p></div>
              ) : notificacionesNoLeidas.map(renderAviso)}
            </div>

            <div className="history-section">
              <div className="section-heading-row">
                <h4>Historial</h4>
                <span className="status-pill success">{notificacionesLeidas.length}</span>
              </div>
              {notificacionesLeidas.length === 0 ? (
                <div className="sin-resultados"><p>Aun no hay avisos leídos en esta vista.</p></div>
              ) : notificacionesLeidas.map(renderAviso)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
