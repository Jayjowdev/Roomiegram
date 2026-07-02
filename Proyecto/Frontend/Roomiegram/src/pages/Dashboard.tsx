import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { publicacionService, type Historia } from "../services/publicacionService";
import { tareaService } from "../services/tareaService";
import { usuarioService } from "../services/usuarioService";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { Tarea } from "../types/Tarea";
import type { UsuarioResumen } from "../types/Usuario";
import { deleteLocalPublicacion, getLocalPublicaciones, isGeneratedProfile } from "../utils/localPublicaciones";

type DashboardStats = {
  publicaciones: number;
  historias: number;
  hogares: number;
  tareas: number;
  usuarios: number;
  colaboradoresPendientes: number;
  solicitudesPendientes: number;
};

type DashboardSection = "publicaciones" | "historias" | "hogares" | "tareas" | "usuarios" | "colaboradores";
type UsuarioFiltro = "todos" | "sin-datos" | "suspendidos" | "clientes";
type BloqueoSection = Exclude<DashboardSection, "usuarios" | "colaboradores">;
type BloqueoEliminarUsuario = {
  key: BloqueoSection;
  text: string;
  action: string;
  label: string;
};
type FiltroAsociacionUsuario = {
  section: BloqueoSection;
  usuarioId: number;
  label: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    publicaciones: 0,
    historias: 0,
    hogares: 0,
    tareas: 0,
    usuarios: 0,
    colaboradoresPendientes: 0,
    solicitudesPendientes: 0,
  });
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [colaboradoresPendientes, setColaboradoresPendientes] = useState<UsuarioResumen[]>([]);
  const [deletingPublicationId, setDeletingPublicationId] = useState<number | null>(null);
  const [deletingHistoriaId, setDeletingHistoriaId] = useState<number | null>(null);
  const [deletingTareaId, setDeletingTareaId] = useState<number | null>(null);
  const [deletingHogarId, setDeletingHogarId] = useState<number | null>(null);
  const [usuarioActionId, setUsuarioActionId] = useState<number | null>(null);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{ usuario: string; value: string } | null>(null);
  const [usuarioFiltro, setUsuarioFiltro] = useState<UsuarioFiltro>("todos");
  const [selectedUsuariosIds, setSelectedUsuariosIds] = useState<number[]>([]);
  const [deletingSelectedUsuarios, setDeletingSelectedUsuarios] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState<Historia | null>(null);
  const [historiaForm, setHistoriaForm] = useState({ titulo: "", mensaje: "" });
  const [savingHistoria, setSavingHistoria] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardFilter, setDashboardFilter] = useState("");
  const [associationFilter, setAssociationFilter] = useState<FiltroAsociacionUsuario | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>("publicaciones");

  useEffect(() => {
    if (!message) return;
    messageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [message]);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      publicacionService.listar(),
      publicacionService.listarHistorias(),
      hogarService.listar(),
      tareaService.listar(),
      usuarioService.listarAdmin(),
      user?.id && user.role === "ADMIN"
        ? usuarioService.listarColaboradoresPendientes(user.id, user.role)
        : Promise.resolve([]),
    ])
      .then(([publicacionesResult, historiasResult, hogaresResult, tareasResult, usuariosResult, colaboradoresResult]) => {
        if (!isMounted) return;

        const backendPublicaciones = publicacionesResult.status === "fulfilled" ? publicacionesResult.value : [];
        const localPublicaciones = getLocalPublicaciones()
          .filter((publicacion) => !isGeneratedProfile(publicacion))
          .map((publicacion) => ({ ...publicacion, origen: "local" as const }));
        const publicacionesData = [
          ...backendPublicaciones.map((publicacion) => ({ ...publicacion, origen: "backend" as const })),
          ...localPublicaciones,
        ];
        const historiasData = historiasResult.status === "fulfilled" ? historiasResult.value : [];
        const hogaresData = hogaresResult.status === "fulfilled" ? hogaresResult.value : [];
        const tareasData = tareasResult.status === "fulfilled" ? tareasResult.value : [];
        const usuariosData = usuariosResult.status === "fulfilled" ? usuariosResult.value : [];
        const colaboradoresData = colaboradoresResult.status === "fulfilled" ? colaboradoresResult.value : [];
        const solicitudesPendientes = hogaresData.reduce(
          (total, hogar) => total + (hogar.solicitudesPendientesIds?.length ?? 0),
          0,
        );

        setStats({
          publicaciones: publicacionesData.length,
          historias: historiasData.length,
          hogares: hogaresData.length,
          tareas: tareasData.length,
          usuarios: usuariosData.length,
          colaboradoresPendientes: colaboradoresData.length,
          solicitudesPendientes,
        });
        setPublicaciones(publicacionesData);
        setHistorias(historiasData);
        setHogares(hogaresData);
        setTareas(tareasData);
        setUsuarios(usuariosData);
        setColaboradoresPendientes(colaboradoresData);

        if ([publicacionesResult, historiasResult, hogaresResult, tareasResult, usuariosResult, colaboradoresResult].some((result) => result.status === "rejected")) {
          setMessage("Algunos datos reales no se pudieron cargar. Intenta nuevamente.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role]);

  const eliminarPublicacion = async (publicacion: Publicacion) => {
    if (!user?.usuario || user.role !== "ADMIN") {
      setMessage("Solo un administrador puede moderar publicaciones.");
      return;
    }

    const confirmar = window.confirm(`¿Eliminar la publicación "${getPublicationTitle(publicacion)}"?`);
    if (!confirmar) return;

    setDeletingPublicationId(publicacion.id);
    setMessage("");

    try {
      if (publicacion.origen === "local") {
        deleteLocalPublicacion(publicacion.id);
      } else {
        await publicacionService.eliminar(publicacion.id, user.usuario, user.role);
      }

      setPublicaciones((current) =>
        current.filter((item) => !(item.id === publicacion.id && item.origen === publicacion.origen)),
      );
      setStats((current) => ({
        ...current,
        publicaciones: Math.max(0, current.publicaciones - 1),
      }));
      setMessage("Publicación eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la publicación.");
    } finally {
      setDeletingPublicationId(null);
    }
  };

  const startEditarHistoria = (historia: Historia) => {
    setEditingHistoria(historia);
    setHistoriaForm({
      titulo: historia.titulo,
      mensaje: historia.mensaje,
    });
    setMessage("Editando historia desde administración.");
  };

  const cancelarEdicionHistoria = () => {
    setEditingHistoria(null);
    setHistoriaForm({ titulo: "", mensaje: "" });
    setMessage("");
  };

  const guardarHistoriaAdmin = async () => {
    if (!editingHistoria) return;
    if (!user?.usuario || user.role !== "ADMIN") {
      setMessage("Solo un administrador puede editar historias.");
      return;
    }

    const titulo = historiaForm.titulo.trim();
    const mensajeHistoria = historiaForm.mensaje.trim();

    if (!titulo) {
      setMessage("El título de la historia es obligatorio.");
      return;
    }
    if (mensajeHistoria.length < 20) {
      setMessage("La historia debe tener al menos 20 caracteres.");
      return;
    }
    if (mensajeHistoria.length > 500) {
      setMessage("La historia no puede superar 500 caracteres.");
      return;
    }

    try {
      setSavingHistoria(true);
      const actualizada = await publicacionService.actualizarHistoria(
        editingHistoria.id,
        {
          titulo,
          mensaje: mensajeHistoria,
          nombreVisible: editingHistoria.nombreVisible,
          usuarioCreador: editingHistoria.usuarioCreador,
        },
        user.usuario,
        user.role,
      );
      setHistorias((current) =>
        current.map((historia) => (historia.id === actualizada.id ? actualizada : historia)),
      );
      setEditingHistoria(null);
      setHistoriaForm({ titulo: "", mensaje: "" });
      setMessage("Historia actualizada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la historia.");
    } finally {
      setSavingHistoria(false);
    }
  };

  const eliminarHistoriaAdmin = async (historia: Historia) => {
    if (!user?.usuario || user.role !== "ADMIN") {
      setMessage("Solo un administrador puede eliminar historias.");
      return;
    }

    const confirmar = window.confirm(`¿Eliminar la historia "${historia.titulo}"?`);
    if (!confirmar) return;

    try {
      setDeletingHistoriaId(historia.id);
      await publicacionService.eliminarHistoria(historia.id, user.usuario, user.role);
      setHistorias((current) => current.filter((item) => item.id !== historia.id));
      setStats((current) => ({
        ...current,
        historias: Math.max(0, current.historias - 1),
      }));
      if (editingHistoria?.id === historia.id) {
        cancelarEdicionHistoria();
      }
      setMessage("Historia eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la historia.");
    } finally {
      setDeletingHistoriaId(null);
    }
  };

  const eliminarTareaAdmin = async (tarea: Tarea) => {
    if (user?.role !== "ADMIN") {
      setMessage("Solo un administrador puede eliminar tareas.");
      return;
    }

    const confirmar = window.confirm(`¿Eliminar la tarea "${tarea.titulo}"?`);
    if (!confirmar) return;

    try {
      setDeletingTareaId(tarea.id);
      await tareaService.eliminar(tarea.id);
      setTareas((current) => current.filter((item) => item.id !== tarea.id));
      setHogares((current) =>
        current.map((hogar) => ({
          ...hogar,
          tareasIds: hogar.tareasIds?.filter((tareaId) => tareaId !== tarea.id) ?? [],
        })),
      );
      setStats((current) => ({
        ...current,
        tareas: Math.max(0, current.tareas - 1),
      }));
      setMessage("Tarea eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la tarea.");
    } finally {
      setDeletingTareaId(null);
    }
  };

  const eliminarHogarAdmin = async (hogar: Hogar) => {
    if (user?.role !== "ADMIN") {
      setMessage("Solo un administrador puede eliminar hogares.");
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar el hogar "${hogar.nombre}"? Esta acción quitará el registro del hogar y sus asociaciones internas.`,
    );
    if (!confirmar) return;

    try {
      setDeletingHogarId(hogar.id);
      await hogarService.eliminarComoAdmin(hogar.id, user.id);
      setHogares((current) => current.filter((item) => item.id !== hogar.id));
      setStats((current) => ({
        ...current,
        hogares: Math.max(0, current.hogares - 1),
        solicitudesPendientes: Math.max(
          0,
          current.solicitudesPendientes - (hogar.solicitudesPendientesIds?.length ?? 0),
        ),
      }));
      setMessage("Hogar eliminado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el hogar.");
    } finally {
      setDeletingHogarId(null);
    }
  };

  const getUsuarioRole = (usuario: UsuarioResumen) => usuario.rol || usuario.role || "CLIENTE";
  const isUsuarioActivo = (usuario: UsuarioResumen) => usuario.cuentaActiva !== false;

  const isPublicacionAsociadaUsuario = (publicacion: Publicacion, usuario: UsuarioResumen) => {
    const usuarioNormalizado = normalizeSearch(usuario.usuario);
    return publicacion.usuarioId === usuario.id || normalizeSearch(publicacion.usuarioCreador) === usuarioNormalizado;
  };

  const isHistoriaAsociadaUsuario = (historia: Historia, usuario: UsuarioResumen) =>
    normalizeSearch(historia.usuarioCreador) === normalizeSearch(usuario.usuario);

  const isHogarAsociadoUsuario = (hogar: Hogar, usuario: UsuarioResumen) =>
    hogar.usuarioCreadorId === usuario.id ||
    hogar.usuarioAdministradorId === usuario.id ||
    hogar.integrantesIds?.includes(usuario.id) ||
    hogar.solicitudesPendientesIds?.includes(usuario.id);

  const isTareaAsociadaUsuario = (tarea: Tarea, usuario: UsuarioResumen) => {
    const encargado = normalizeSearch(tarea.encargado);
    return encargado === normalizeSearch(usuario.usuario) || encargado === normalizeSearch(usuario.nombre);
  };

  const getDatosAsociadosUsuario = (usuario: UsuarioResumen) => {
    const publicacionesCount = publicaciones.filter((publicacion) => isPublicacionAsociadaUsuario(publicacion, usuario)).length;
    const historiasCount = historias.filter((historia) => isHistoriaAsociadaUsuario(historia, usuario)).length;
    const hogaresCount = hogares.filter((hogar) => isHogarAsociadoUsuario(hogar, usuario)).length;
    const tareasCount = tareas.filter((tarea) => isTareaAsociadaUsuario(tarea, usuario)).length;
    const total = publicacionesCount + historiasCount + hogaresCount + tareasCount;

    return {
      publicaciones: publicacionesCount,
      historias: historiasCount,
      hogares: hogaresCount,
      tareas: tareasCount,
      total,
      tieneDatos: total > 0,
    };
  };

  const pluralizar = (cantidad: number, singular: string, plural: string) =>
    `${cantidad} ${cantidad === 1 ? singular : plural}`;

  const getUsuarioFiltroAsociado = (usuario: UsuarioResumen, section: DashboardSection) => {
    if (section === "hogares") {
      return usuario.usuario || usuario.correo || usuario.nombre || `usuario ${usuario.id}`;
    }

    if (section === "tareas") {
      return usuario.usuario || usuario.nombre || usuario.correo || "";
    }

    return usuario.usuario || usuario.nombre || usuario.correo || "";
  };

  const irABloqueoUsuario = (section: BloqueoSection, usuario: UsuarioResumen, label: string) => {
    const filtro = getUsuarioFiltroAsociado(usuario, section);

    setActiveSection(section);
    setAssociationFilter({ section, usuarioId: usuario.id, label });
    if (filtro) {
      setDashboardFilter(filtro);
      setMessage(`Mostrando ${label.toLowerCase()} asociados a ${usuario.usuario || usuario.nombre}.`);
    } else {
      setMessage("Revisa este dato desde el módulo correspondiente.");
    }

    window.setTimeout(() => {
      document.getElementById(`dashboard-section-${section}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const getBloqueosEliminarUsuario = (usuario: UsuarioResumen): BloqueoEliminarUsuario[] => {
    const datos = getDatosAsociadosUsuario(usuario);

    const bloqueos: Array<BloqueoEliminarUsuario | null> = [
      datos.hogares > 0
        ? {
            key: "hogares" as const,
            text: `Pertenece a ${pluralizar(datos.hogares, "hogar", "hogares")}`,
            action: "Ver hogares",
            label: "hogares",
          }
        : null,
      datos.tareas > 0
        ? {
            key: "tareas" as const,
            text: `Tiene ${pluralizar(datos.tareas, "tarea asociada", "tareas asociadas")}`,
            action: "Ver tareas",
            label: "tareas",
          }
        : null,
      datos.publicaciones > 0
        ? {
            key: "publicaciones" as const,
            text: `Tiene ${pluralizar(datos.publicaciones, "publicación asociada", "publicaciones asociadas")}`,
            action: "Ver publicaciones",
            label: "publicaciones",
          }
        : null,
      datos.historias > 0
        ? {
            key: "historias" as const,
            text: `Tiene ${pluralizar(datos.historias, "historia publicada", "historias publicadas")}`,
            action: "Ver historias",
            label: "historias",
          }
        : null,
    ];

    return bloqueos.filter((bloqueo): bloqueo is BloqueoEliminarUsuario => Boolean(bloqueo));
  };

  const esUsuarioEliminable = (usuario: UsuarioResumen) => {
    const datosAsociados = getDatosAsociadosUsuario(usuario);
    return usuario.id !== user?.id && getUsuarioRole(usuario) !== "ADMIN" && !datosAsociados.tieneDatos;
  };

  const reemplazarUsuario = (usuarioActualizado: UsuarioResumen) => {
    setUsuarios((current) => current.map((item) => (item.id === usuarioActualizado.id ? usuarioActualizado : item)));
    setColaboradoresPendientes((current) =>
      current.map((item) => (item.id === usuarioActualizado.id ? usuarioActualizado : item)),
    );
  };

  const suspenderUsuarioAdmin = async (usuarioObjetivo: UsuarioResumen) => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede suspender usuarios.");
      return;
    }
    if (usuarioObjetivo.id === user.id) {
      setMessage("No puedes suspender tu propia cuenta administrativa.");
      return;
    }

    const confirmar = window.confirm(`¿Suspender la cuenta de ${usuarioObjetivo.usuario}?`);
    if (!confirmar) return;

    try {
      setUsuarioActionId(usuarioObjetivo.id);
      const actualizado = await usuarioService.suspender(usuarioObjetivo.id, user.id, user.role);
      reemplazarUsuario(actualizado);
      setTemporaryPassword(null);
      setMessage("Cuenta suspendida correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo suspender la cuenta.");
    } finally {
      setUsuarioActionId(null);
    }
  };

  const reactivarUsuarioAdmin = async (usuarioObjetivo: UsuarioResumen) => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede reactivar usuarios.");
      return;
    }

    try {
      setUsuarioActionId(usuarioObjetivo.id);
      const actualizado = await usuarioService.reactivar(usuarioObjetivo.id, user.id, user.role);
      reemplazarUsuario(actualizado);
      setTemporaryPassword(null);
      setMessage("Cuenta reactivada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo reactivar la cuenta.");
    } finally {
      setUsuarioActionId(null);
    }
  };

  const restablecerContrasenaAdmin = async (usuarioObjetivo: UsuarioResumen) => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede restablecer contraseñas.");
      return;
    }
    if (usuarioObjetivo.id === user.id) {
      setMessage("No puedes restablecer tu propia contraseña desde el panel administrativo.");
      return;
    }

    const confirmar = window.confirm(`¿Restablecer la contraseña de ${usuarioObjetivo.usuario}?`);
    if (!confirmar) return;

    try {
      setUsuarioActionId(usuarioObjetivo.id);
      const resultado = await usuarioService.restablecerContrasena(usuarioObjetivo.id, user.id, user.role);
      reemplazarUsuario(resultado.usuario);
      setTemporaryPassword({ usuario: usuarioObjetivo.usuario, value: resultado.contrasenaTemporal });
      setMessage(resultado.mensaje);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.");
    } finally {
      setUsuarioActionId(null);
    }
  };

  const eliminarUsuarioAdmin = async (usuarioObjetivo: UsuarioResumen) => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede eliminar usuarios.");
      return;
    }
    if (usuarioObjetivo.id === user.id) {
      setMessage("No puedes eliminar tu propia cuenta administrativa.");
      return;
    }
    if (getUsuarioRole(usuarioObjetivo) === "ADMIN") {
      setMessage("No se puede eliminar una cuenta con rol ADMIN desde esta acción.");
      return;
    }

    const datosAsociados = getDatosAsociadosUsuario(usuarioObjetivo);
    if (datosAsociados.tieneDatos) {
      setSelectedUsuarioId(usuarioObjetivo.id);
      setMessage("No se puede eliminar este usuario porque tiene información asociada. Revisa sus publicaciones, hogares o registros relacionados antes de continuar.");
      return;
    }

    const confirmar = window.confirm("¿Seguro que quieres eliminar este usuario? Esta acción no se puede deshacer.");
    if (!confirmar) return;

    try {
      setUsuarioActionId(usuarioObjetivo.id);
      await usuarioService.eliminar(usuarioObjetivo.id, user.id, user.role);
      setUsuarios((current) => current.filter((item) => item.id !== usuarioObjetivo.id));
      setSelectedUsuariosIds((current) => current.filter((id) => id !== usuarioObjetivo.id));
      setStats((current) => ({ ...current, usuarios: Math.max(0, current.usuarios - 1) }));
      if (selectedUsuarioId === usuarioObjetivo.id) {
        setSelectedUsuarioId(null);
      }
      setTemporaryPassword(null);
      setMessage("Usuario eliminado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el usuario.");
    } finally {
      setUsuarioActionId(null);
    }
  };

  const toggleUsuarioSeleccionado = (usuarioObjetivo: UsuarioResumen) => {
    if (!esUsuarioEliminable(usuarioObjetivo)) {
      setMessage("No se puede seleccionar este usuario porque tiene información asociada o permisos administrativos.");
      return;
    }

    setSelectedUsuariosIds((current) =>
      current.includes(usuarioObjetivo.id)
        ? current.filter((id) => id !== usuarioObjetivo.id)
        : [...current, usuarioObjetivo.id],
    );
  };

  const seleccionarUsuariosEliminables = (usuariosVisibles: UsuarioResumen[]) => {
    const idsEliminables = usuariosVisibles
      .filter((usuarioItem) => esUsuarioEliminable(usuarioItem))
      .map((usuarioItem) => usuarioItem.id);

    setSelectedUsuariosIds(idsEliminables);
    setMessage(idsEliminables.length > 0
      ? `${idsEliminables.length} cuenta(s) sin datos asociados seleccionada(s).`
      : "No hay usuarios eliminables en la vista actual.");
  };

  const limpiarSeleccionUsuarios = () => {
    setSelectedUsuariosIds([]);
  };

  const eliminarUsuariosSeleccionados = async () => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede eliminar usuarios.");
      return;
    }

    const usuariosSeleccionados = usuarios.filter((usuarioItem) => selectedUsuariosIds.includes(usuarioItem.id));
    const usuariosEliminables = usuariosSeleccionados.filter((usuarioItem) => esUsuarioEliminable(usuarioItem));

    if (usuariosEliminables.length === 0) {
      setMessage("Selecciona usuarios sin datos asociados para eliminar.");
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar los usuarios seleccionados? Esta acción no se puede deshacer.\n\nSe eliminarán ${usuariosEliminables.length} usuarios sin datos asociados.`,
    );
    if (!confirmar) return;

    setDeletingSelectedUsuarios(true);
    setMessage("");

    const eliminados: number[] = [];
    const fallidos: string[] = [];

    for (const usuarioObjetivo of usuariosEliminables) {
      try {
        await usuarioService.eliminar(usuarioObjetivo.id, user.id, user.role);
        eliminados.push(usuarioObjetivo.id);
      } catch (error) {
        const motivo = error instanceof Error ? error.message : "No se pudo eliminar.";
        fallidos.push(`${usuarioObjetivo.usuario}: ${motivo}`);
      }
    }

    if (eliminados.length > 0) {
      setUsuarios((current) => current.filter((usuarioItem) => !eliminados.includes(usuarioItem.id)));
      setStats((current) => ({ ...current, usuarios: Math.max(0, current.usuarios - eliminados.length) }));
      if (selectedUsuarioId && eliminados.includes(selectedUsuarioId)) {
        setSelectedUsuarioId(null);
      }
    }

    setSelectedUsuariosIds([]);
    setDeletingSelectedUsuarios(false);

    if (fallidos.length > 0) {
      setMessage(`Eliminados correctamente: ${eliminados.length}. No eliminados: ${fallidos.length}. ${fallidos.join(" ")}`);
      return;
    }

    setMessage(`Eliminación completada. Se eliminaron ${eliminados.length} usuario(s) sin datos asociados.`);
  };

  const formatDate = (value?: string) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-CL");
  };

  const getPublicationTitle = (publicacion: Publicacion) =>
    publicacion.titulo || publicacion.nombre || `${publicacion.usuarioCreador || "Usuario"} busca roomie`;

  const getPublicationPrice = (publicacion: Publicacion) => {
    const price = publicacion.precio ?? publicacion.precioMensual;
    return typeof price === "number" && price > 0 ? `$${price.toLocaleString("es-CL")}` : "Sin precio";
  };

  const getPublicationTypeLabel = (publicacion: Publicacion) => {
    if (publicacion.tipo === "busco_roomie") return "Busco roomie";
    if (publicacion.tipo === "ofrezco_casa" || publicacion.origen === "backend") return "Ofrezco casa";
    return "Sin tipo";
  };

  const resumirTexto = (value?: string, max = 150) => {
    const texto = value?.trim() || "Sin descripción";
    return texto.length > max ? `${texto.slice(0, max).trim()}...` : texto;
  };

  const normalizeSearch = (value: unknown) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const matchesFilter = (values: unknown[]) => {
    const filter = normalizeSearch(dashboardFilter);
    if (!filter) return true;
    return values.some((value) => normalizeSearch(value).includes(filter));
  };

  const getHogarDeTarea = (tareaId?: number) =>
    hogares.find((hogar) => hogar.tareasIds?.includes(Number(tareaId)));

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const getUsuarioLabel = (usuarioId?: number, prefix = "Usuario") => {
    if (!usuarioId) return `${prefix} no informado`;
    const usuario = usuariosById.get(usuarioId);
    const nombre = usuario?.nombre || usuario?.usuario;
    return nombre ? `${nombre} (#${usuarioId})` : `${prefix} #${usuarioId}`;
  };

  const getUsuarioSearchValues = (usuarioId?: number) => {
    if (!usuarioId) return [];
    const usuario = usuariosById.get(usuarioId);
    return [usuarioId, `usuario ${usuarioId}`, usuario?.nombre, usuario?.usuario, usuario?.correo];
  };

  const aprobarColaboradorAdmin = async (colaborador: UsuarioResumen) => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede aprobar colaboradores.");
      return;
    }

    try {
      setUsuarioActionId(colaborador.id);
      const actualizado = await usuarioService.aprobarColaborador(colaborador.id, user.id, user.role);
      reemplazarUsuario(actualizado);
      setColaboradoresPendientes((current) => current.filter((item) => item.id !== colaborador.id));
      setStats((current) => ({
        ...current,
        colaboradoresPendientes: Math.max(0, current.colaboradoresPendientes - 1),
      }));
      setMessage("Colaborador aprobado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo aprobar el colaborador.");
    } finally {
      setUsuarioActionId(null);
    }
  };

  const rechazarColaboradorAdmin = async (colaborador: UsuarioResumen) => {
    if (!user?.id || user.role !== "ADMIN") {
      setMessage("Solo una cuenta ADMIN puede rechazar colaboradores.");
      return;
    }

    const confirmar = window.confirm(`¿Rechazar la solicitud de colaborador de ${colaborador.usuario}?`);
    if (!confirmar) return;

    try {
      setUsuarioActionId(colaborador.id);
      const actualizado = await usuarioService.rechazarColaborador(colaborador.id, user.id, user.role);
      reemplazarUsuario(actualizado);
      setColaboradoresPendientes((current) => current.filter((item) => item.id !== colaborador.id));
      setStats((current) => ({
        ...current,
        colaboradoresPendientes: Math.max(0, current.colaboradoresPendientes - 1),
      }));
      setMessage("Solicitud de colaborador rechazada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo rechazar el colaborador.");
    } finally {
      setUsuarioActionId(null);
    }
  };

  const usuarioFiltroAsociacion = associationFilter ? usuariosById.get(associationFilter.usuarioId) : undefined;

  const isFiltroAsociacionActivo = (section: BloqueoSection) =>
    associationFilter?.section === section && Boolean(usuarioFiltroAsociacion);

  const publicacionesFiltradas = useMemo(
    () => {
      if (isFiltroAsociacionActivo("publicaciones") && usuarioFiltroAsociacion) {
        return publicaciones.filter((publicacion) => isPublicacionAsociadaUsuario(publicacion, usuarioFiltroAsociacion));
      }

      return publicaciones.filter((publicacion) =>
        matchesFilter([
          getPublicationTitle(publicacion),
          publicacion.descripcion,
          publicacion.tipo || (publicacion.origen === "backend" ? "ofrezco_casa" : "Sin tipo"),
          publicacion.usuarioCreador,
          publicacion.nombre,
          publicacion.ubicacion,
          publicacion.origen,
          publicacion.correo,
          getPublicationPrice(publicacion),
        ]),
      );
    },
    [associationFilter, dashboardFilter, publicaciones, usuarioFiltroAsociacion],
  );

  const historiasFiltradas = useMemo(
    () => {
      if (isFiltroAsociacionActivo("historias") && usuarioFiltroAsociacion) {
        return historias.filter((historia) => isHistoriaAsociadaUsuario(historia, usuarioFiltroAsociacion));
      }

      return historias.filter((historia) =>
        matchesFilter([
          historia.titulo,
          historia.mensaje,
          historia.nombreVisible,
          historia.usuarioCreador,
          formatDate(historia.fechaCreacion),
          "historia",
        ]),
      );
    },
    [associationFilter, dashboardFilter, historias, usuarioFiltroAsociacion],
  );

  const hogaresFiltrados = useMemo(
    () => {
      if (isFiltroAsociacionActivo("hogares") && usuarioFiltroAsociacion) {
        return hogares.filter((hogar) => isHogarAsociadoUsuario(hogar, usuarioFiltroAsociacion));
      }

      return hogares.filter((hogar) =>
        matchesFilter([
          hogar.id,
          hogar.nombre,
          hogar.descripcion,
          hogar.activo ? "activo" : "inactivo",
          `creador ${hogar.usuarioCreadorId}`,
          `admin ${hogar.usuarioAdministradorId}`,
          ...getUsuarioSearchValues(hogar.usuarioCreadorId),
          ...getUsuarioSearchValues(hogar.usuarioAdministradorId),
          ...(hogar.integrantesIds || []).flatMap((usuarioId) => getUsuarioSearchValues(usuarioId)),
          ...(hogar.solicitudesPendientesIds || []).flatMap((usuarioId) => getUsuarioSearchValues(usuarioId)),
          `integrantes ${hogar.integrantesIds?.length ?? 0}`,
          (hogar.solicitudesPendientesIds?.length ?? 0) > 0 ? "con solicitudes" : "sin solicitudes",
          `solicitudes ${hogar.solicitudesPendientesIds?.length ?? 0}`,
          `tareas ${hogar.tareasIds?.length ?? 0}`,
          formatDate(hogar.fechaCreacion),
        ]),
      );
    },
    [associationFilter, dashboardFilter, hogares, usuariosById, usuarioFiltroAsociacion],
  );

  const tareasFiltradas = useMemo(
    () => {
      if (isFiltroAsociacionActivo("tareas") && usuarioFiltroAsociacion) {
        return tareas.filter((tarea) => isTareaAsociadaUsuario(tarea, usuarioFiltroAsociacion));
      }

      return tareas.filter((tarea) => {
        const hogar = getHogarDeTarea(tarea.id);
        return matchesFilter([
          tarea.id,
          tarea.titulo,
          tarea.descripcion,
          tarea.encargado,
          hogar?.nombre,
          hogar ? `hogar ${hogar.id}` : "sin hogar",
          tarea.completada ? "completada" : "pendiente",
          formatDate(tarea.fecha),
        ]);
      });
    },
    [associationFilter, dashboardFilter, tareas, hogares, usuarioFiltroAsociacion],
  );

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((usuarioItem) => {
        const datosAsociados = getDatosAsociadosUsuario(usuarioItem);
        const usuarioEliminable = esUsuarioEliminable(usuarioItem);

        if (usuarioFiltro === "sin-datos" && !usuarioEliminable) return false;
        if (usuarioFiltro === "suspendidos" && isUsuarioActivo(usuarioItem)) return false;
        if (usuarioFiltro === "clientes" && getUsuarioRole(usuarioItem) !== "CLIENTE") return false;

        return matchesFilter([
          usuarioItem.id,
          usuarioItem.nombre,
          usuarioItem.usuario,
          usuarioItem.correo,
          usuarioItem.telefono,
          getUsuarioRole(usuarioItem),
          isUsuarioActivo(usuarioItem) ? "activa" : "suspendida",
          usuarioItem.estadoCuenta,
          usuarioItem.hogarActual,
          `publicaciones ${datosAsociados.publicaciones}`,
          `historias ${datosAsociados.historias}`,
          `hogares ${datosAsociados.hogares}`,
          `tareas ${datosAsociados.tareas}`,
        ]);
      }),
    [dashboardFilter, usuarioFiltro, usuarios, publicaciones, historias, hogares, tareas, user?.id],
  );

  const colaboradoresFiltrados = useMemo(
    () =>
      colaboradoresPendientes.filter((colaborador) =>
        matchesFilter([
          colaborador.id,
          colaborador.nombre,
          colaborador.usuario,
          colaborador.telefono,
          colaborador.rol || colaborador.role,
          "colaborador",
          "pendiente",
        ]),
      ),
    [dashboardFilter, colaboradoresPendientes],
  );

  const selectedUsuario = useMemo(
    () => usuarios.find((usuarioItem) => usuarioItem.id === selectedUsuarioId) || usuariosFiltrados[0] || null,
    [selectedUsuarioId, usuarios, usuariosFiltrados],
  );

  const usuariosEliminablesVisibles = useMemo(
    () => usuariosFiltrados.filter((usuarioItem) => esUsuarioEliminable(usuarioItem)),
    [usuariosFiltrados, publicaciones, historias, hogares, tareas, user?.id],
  );

  useEffect(() => {
    setSelectedUsuariosIds((current) =>
      current.filter((id) => usuarios.some((usuarioItem) => usuarioItem.id === id && esUsuarioEliminable(usuarioItem))),
    );
  }, [usuarios, publicaciones, historias, hogares, tareas, user?.id]);

  const hasActiveFilter = dashboardFilter.trim().length > 0;
  const filteredTotal =
    publicacionesFiltradas.length +
    hogaresFiltrados.length +
    tareasFiltradas.length +
    historiasFiltradas.length +
    usuariosFiltrados.length +
    colaboradoresFiltrados.length;
  const totalRegistros =
    stats.publicaciones +
    stats.historias +
    stats.hogares +
    stats.tareas +
    stats.usuarios +
    stats.colaboradoresPendientes;
  const dashboardTabs = [
    { id: "publicaciones" as const, label: "Publicaciones", count: publicacionesFiltradas.length },
    { id: "historias" as const, label: "Historias", count: historiasFiltradas.length },
    { id: "hogares" as const, label: "Hogares", count: hogaresFiltrados.length },
    { id: "tareas" as const, label: "Tareas", count: tareasFiltradas.length },
    { id: "usuarios" as const, label: "Usuarios", count: usuariosFiltrados.length },
    { id: "colaboradores" as const, label: "Colaboradores", count: colaboradoresFiltrados.length },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" type="button" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="dashboard-welcome">
        <h1>Dashboard de administración</h1>
        <p>
          Hola, {user?.nombre || user?.usuario || "usuario"}. Revisa métricas, gestiona publicaciones y modera
          contenido de la plataforma.
        </p>
      </section>

      {message && <p className="api-message" ref={messageRef}>{message}</p>}

      <section className="dashboard-stats">
        <article className="dashboard-card">
          <h5>Publicaciones</h5>
          <h2>{isLoading ? "..." : stats.publicaciones}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Historias</h5>
          <h2>{isLoading ? "..." : stats.historias}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Hogares</h5>
          <h2>{isLoading ? "..." : stats.hogares}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Tareas</h5>
          <h2>{isLoading ? "..." : stats.tareas}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Usuarios</h5>
          <h2>{isLoading ? "..." : stats.usuarios}</h2>
        </article>
        <article className="dashboard-card">
          <h5>Colaboradores pendientes</h5>
          <h2>{isLoading ? "..." : stats.colaboradoresPendientes}</h2>
        </article>
      </section>

      <section className="dashboard-filter-panel">
        <div>
          <label htmlFor="dashboard-filter">Buscar actividad</label>
          <p>
            Filtra publicaciones, historias, hogares, tareas, usuarios y colaboradores por nombre, correo, tipo, hogar,
            encargado o estado.
          </p>
        </div>
        <div className="dashboard-filter-controls">
          <input
            id="dashboard-filter"
            className="form-control"
            type="search"
            placeholder="Ej: franco, casa amoblada, pendiente, Santiago"
            value={dashboardFilter}
            onChange={(event) => {
              setAssociationFilter(null);
              setDashboardFilter(event.target.value);
            }}
          />
          <button
            className="btn btn-outline-success"
            type="button"
            onClick={() => {
              setAssociationFilter(null);
              setDashboardFilter("");
            }}
            disabled={!hasActiveFilter && !associationFilter}
          >
            Limpiar
          </button>
        </div>
        <span className="dashboard-filter-summary">
          {associationFilter && usuarioFiltroAsociacion
            ? `Mostrando ${associationFilter.label} asociados a ${usuarioFiltroAsociacion.nombre || usuarioFiltroAsociacion.usuario}`
            : hasActiveFilter
            ? `Mostrando ${filteredTotal} resultados para "${dashboardFilter.trim()}"`
            : `Mostrando ${totalRegistros} registros reales`}
        </span>
      </section>

      <section className="dashboard-section-nav" aria-label="Secciones del dashboard">
        {dashboardTabs.map((tab) => (
          <button
            className={`dashboard-section-tab ${activeSection === tab.id ? "active" : ""}`}
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
          >
            <span>{tab.label}</span>
            <strong>{tab.count}</strong>
          </button>
        ))}
      </section>

      <section
        className={`dashboard-content dashboard-content-primary ${activeSection === "publicaciones" ? "" : "dashboard-hidden-section"}`}
        id="dashboard-section-publicaciones"
      >
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <h4>Publicaciones registradas</h4>
            <span className="status-pill">{publicacionesFiltradas.length} resultados</span>
          </div>
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando publicaciones...</p></div>
          ) : publicaciones.length === 0 ? (
            <div className="sin-resultados"><p>No hay publicaciones registradas.</p></div>
          ) : publicacionesFiltradas.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list">
              {publicacionesFiltradas.map((publicacion) => (
                <article className="module-item" key={`${publicacion.origen || "backend"}-${publicacion.id}`}>
                  <div className="section-heading-row">
                    <h4>{getPublicationTitle(publicacion)}</h4>
                    <span className="status-pill">{publicacion.usuarioCreador || "Sin creador"}</span>
                  </div>
                  <p>{publicacion.descripcion || "Sin descripción"}</p>
                  <span>
                    {getPublicationTypeLabel(publicacion)} -{" "}
                    {publicacion.ubicacion || "Sin ubicación"} -{" "}
                    {getPublicationPrice(publicacion)}
                  </span>
                  <div className="item-actions">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => eliminarPublicacion(publicacion)}
                      disabled={deletingPublicationId === publicacion.id}
                    >
                      {deletingPublicationId === publicacion.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-profile">
          <span className="demo-kicker">Sesión</span>
          <h4>Sesión activa</h4>
          <div className="admin-session-card">
            <span><strong>Usuario:</strong> {user?.usuario || "No informado"}</span>
            <span className="status-pill success">{user?.role || "CLIENTE"}</span>
          </div>
          <p className="admin-session-note">Permisos de moderacion y gestion de contenido.</p>
        </div>
      </section>

      <section
        className={`dashboard-content dashboard-content-wide ${activeSection === "historias" ? "" : "dashboard-hidden-section"}`}
        id="dashboard-section-historias"
      >
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <div>
              <h4>Historias de usuarios</h4>
              <p className="dashboard-section-help">Gestiona testimonios reales publicados por usuarios.</p>
            </div>
            <span className="status-pill">{historiasFiltradas.length} resultados</span>
          </div>

          {editingHistoria && (
            <div className="admin-inline-editor">
              <div>
                <label htmlFor="admin-historia-titulo">Título</label>
                <input
                  id="admin-historia-titulo"
                  className="form-control"
                  maxLength={80}
                  value={historiaForm.titulo}
                  onChange={(event) =>
                    setHistoriaForm((current) => ({ ...current, titulo: event.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="admin-historia-mensaje">Mensaje</label>
                <textarea
                  id="admin-historia-mensaje"
                  className="form-control"
                  rows={4}
                  maxLength={500}
                  value={historiaForm.mensaje}
                  onChange={(event) =>
                    setHistoriaForm((current) => ({ ...current, mensaje: event.target.value }))
                  }
                />
                <small>{historiaForm.mensaje.length}/500 caracteres</small>
              </div>
              <div className="item-actions">
                <button
                  className="btn btn-success btn-sm"
                  type="button"
                  onClick={guardarHistoriaAdmin}
                  disabled={savingHistoria}
                >
                  {savingHistoria ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  type="button"
                  onClick={cancelarEdicionHistoria}
                  disabled={savingHistoria}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="sin-resultados"><p>Cargando historias...</p></div>
          ) : historias.length === 0 ? (
            <div className="sin-resultados"><p>No hay historias registradas.</p></div>
          ) : historiasFiltradas.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list dashboard-history-list">
              {historiasFiltradas.map((historia) => (
                <article className="module-item dashboard-history-item" key={historia.id}>
                  <div className="section-heading-row">
                    <div>
                      <h4>{historia.titulo}</h4>
                      <span>{historia.nombreVisible || "Sin nombre visible"}</span>
                    </div>
                    <span className="status-pill">{historia.usuarioCreador || "Sin creador"}</span>
                  </div>
                  <p>{resumirTexto(historia.mensaje)}</p>
                  <small>Fecha: {formatDate(historia.fechaCreacion)}</small>
                  <div className="item-actions">
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={() => startEditarHistoria(historia)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => eliminarHistoriaAdmin(historia)}
                      disabled={deletingHistoriaId === historia.id}
                    >
                      {deletingHistoriaId === historia.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        className={`dashboard-content dashboard-single-switch ${activeSection === "hogares" || activeSection === "tareas" ? "" : "dashboard-hidden-section"}`}
        id={activeSection === "tareas" ? "dashboard-section-tareas" : "dashboard-section-hogares"}
      >
        <div className={`dashboard-activity ${activeSection === "hogares" ? "" : "dashboard-hidden-section"}`}>
          <div className="section-heading-row">
            <div>
              <h4>Hogares registrados</h4>
              <p className="dashboard-section-help">
                Vista compacta de hogares, asociaciones y estado administrativo.
              </p>
            </div>
            <span className="status-pill">{hogaresFiltrados.length} resultados</span>
          </div>
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando hogares...</p></div>
          ) : hogares.length === 0 ? (
            <div className="sin-resultados"><p>No hay hogares registrados.</p></div>
          ) : hogaresFiltrados.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="admin-hogar-list">
              {hogaresFiltrados.map((hogar) => {
                const integrantesCount = hogar.integrantesIds?.length ?? 0;
                const solicitudesCount = hogar.solicitudesPendientesIds?.length ?? 0;
                const tareasCount = hogar.tareasIds?.length ?? 0;
                const cuentasCount = hogar.hogarCuentaIds?.length ?? 0;
                const comprobantesCount = hogar.comprobanteIds?.length ?? 0;
                const tieneSolicitudes = solicitudesCount > 0;

                return (
                  <article className="admin-hogar-row" key={hogar.id}>
                    <div className="admin-hogar-main">
                      <span className="admin-hogar-id">#{hogar.id}</span>
                      <h4>{hogar.nombre}</h4>
                      <p>{hogar.descripcion || "Sin descripción registrada."}</p>
                    </div>

                    <div className="admin-hogar-state">
                      <span className={`status-pill ${hogar.activo ? "success" : ""}`}>
                        {hogar.activo ? "Activo" : "Inactivo"}
                      </span>
                      {tieneSolicitudes && (
                        <span className="status-pill warning">
                          {solicitudesCount} {solicitudesCount === 1 ? "solicitud" : "solicitudes"}
                        </span>
                      )}
                    </div>

                    <div className="admin-hogar-counts" aria-label={`Datos del hogar ${hogar.nombre}`}>
                      <span><strong>{integrantesCount}</strong> Integrantes</span>
                      <span><strong>{tareasCount}</strong> Tareas</span>
                      <span><strong>{cuentasCount}</strong> Cuentas</span>
                      <span><strong>{comprobantesCount}</strong> Comprobantes</span>
                    </div>

                    <div className="admin-hogar-admin">
                      <div>
                        <span>Creador</span>
                        <strong>{getUsuarioLabel(hogar.usuarioCreadorId, "Usuario")}</strong>
                      </div>
                      <div>
                        <span>Admin</span>
                        <strong>{getUsuarioLabel(hogar.usuarioAdministradorId, "Admin")}</strong>
                      </div>
                      <div>
                        <span>Fecha de creacion</span>
                        <strong>{formatDate(hogar.fechaCreacion)}</strong>
                      </div>
                    </div>

                    {integrantesCount > 0 && (
                      <div className="admin-hogar-integrantes">
                        <span>Integrantes: {hogar.integrantesIds.map((usuarioId) => getUsuarioLabel(usuarioId, "Integrante")).join(", ")}</span>
                      </div>
                    )}

                    <div className="admin-hogar-actions">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        type="button"
                        onClick={() => eliminarHogarAdmin(hogar)}
                        disabled={deletingHogarId === hogar.id}
                      >
                        {deletingHogarId === hogar.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className={`dashboard-activity ${activeSection === "tareas" ? "" : "dashboard-hidden-section"}`}>
          <div className="section-heading-row">
            <h4>Tareas registradas</h4>
            <span className="status-pill">{tareasFiltradas.length} resultados</span>
          </div>
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando tareas...</p></div>
          ) : tareas.length === 0 ? (
            <div className="sin-resultados"><p>No hay tareas registradas.</p></div>
          ) : tareasFiltradas.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list">
              {tareasFiltradas.map((tarea) => {
                const hogar = getHogarDeTarea(tarea.id);
                return (
                  <article className="module-item" key={tarea.id}>
                    <div className="section-heading-row">
                      <div>
                        <h4>{tarea.titulo}</h4>
                        <span>ID tarea: {tarea.id}</span>
                      </div>
                      <span className={`status-pill ${tarea.completada ? "success" : ""}`}>
                        {tarea.completada ? "Completada" : "Pendiente"}
                      </span>
                    </div>
                    <p>{tarea.descripcion || "Sin descripción"}</p>
                    <div className="admin-record-meta">
                      <span>Hogar: {hogar?.nombre || "Sin hogar asociado"}</span>
                      <span>Encargado: {tarea.encargado || "Sin encargado"}</span>
                      <span>Fecha limite: {formatDate(tarea.fecha)}</span>
                    </div>
                    <div className="item-actions">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        type="button"
                        onClick={() => eliminarTareaAdmin(tarea)}
                        disabled={deletingTareaId === tarea.id}
                      >
                        {deletingTareaId === tarea.id ? "Eliminando..." : "Eliminar tarea"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        className={`dashboard-content dashboard-content-wide ${activeSection === "colaboradores" ? "" : "dashboard-hidden-section"}`}
        id="dashboard-section-colaboradores"
      >
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <div>
              <h4>Solicitudes de colaboradores</h4>
              <p className="dashboard-section-help">
                Revisa cuentas que pidieron registrarse como colaborador antes de permitir su acceso.
              </p>
            </div>
            <span className="status-pill">{colaboradoresFiltrados.length} pendientes</span>
          </div>

          {isLoading ? (
            <div className="sin-resultados"><p>Cargando colaboradores...</p></div>
          ) : colaboradoresPendientes.length === 0 ? (
            <div className="sin-resultados"><p>No hay solicitudes de colaboradores pendientes.</p></div>
          ) : colaboradoresFiltrados.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="module-list admin-collaborator-list">
              {colaboradoresFiltrados.map((colaborador) => (
                <article className="module-item admin-collaborator-item" key={colaborador.id}>
                  <div className="section-heading-row">
                    <div>
                      <h4>{colaborador.nombre || colaborador.usuario}</h4>
                      <span>{colaborador.usuario} - ID #{colaborador.id}</span>
                    </div>
                    <span className="status-pill warning">Pendiente</span>
                  </div>
                  <div className="admin-record-meta">
                    <span>Teléfono: {colaborador.telefono || "No informado"}</span>
                    <span>Rol solicitado: {getUsuarioRole(colaborador)}</span>
                    <span>Estado: {colaborador.estadoCuenta || "Activa"}</span>
                  </div>
                  <p>
                    Esta cuenta no puede iniciar sesión como colaborador hasta que una cuenta ADMIN apruebe la solicitud.
                  </p>
                  <div className="item-actions">
                    <button
                      className="btn btn-success btn-sm"
                      type="button"
                      onClick={() => aprobarColaboradorAdmin(colaborador)}
                      disabled={usuarioActionId === colaborador.id}
                    >
                      {usuarioActionId === colaborador.id ? "Procesando..." : "Aprobar"}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => rechazarColaboradorAdmin(colaborador)}
                      disabled={usuarioActionId === colaborador.id}
                    >
                      {usuarioActionId === colaborador.id ? "Procesando..." : "Rechazar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        className={`dashboard-content dashboard-content-wide ${activeSection === "usuarios" ? "" : "dashboard-hidden-section"}`}
        id="dashboard-section-usuarios"
      >
        <div className="dashboard-activity">
          <div className="section-heading-row">
            <div>
              <h4>Gestión de usuarios</h4>
              <p className="dashboard-section-help">
                Revisa el estado de la cuenta, datos asociados y acciones administrativas disponibles.
              </p>
            </div>
            <span className="status-pill">{usuariosFiltrados.length} resultados</span>
          </div>

          {temporaryPassword && (
            <div className="admin-user-alert">
              <strong>Contraseña temporal para {temporaryPassword.usuario}:</strong>
              <code>{temporaryPassword.value}</code>
              <span>Entrégala por un canal seguro y recomienda cambiarla al iniciar sesión.</span>
            </div>
          )}

          <div className="admin-users-toolbar">
            <div className="admin-users-filters" aria-label="Filtros de usuarios">
              {[
                { id: "todos" as const, label: "Todos" },
                { id: "sin-datos" as const, label: "Sin datos asociados" },
                { id: "suspendidos" as const, label: "Suspendidos" },
                { id: "clientes" as const, label: "Clientes" },
              ].map((filter) => (
                <button
                  className={`filter-chip ${usuarioFiltro === filter.id ? "active" : ""}`}
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setUsuarioFiltro(filter.id);
                    setSelectedUsuariosIds([]);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="admin-users-bulk-actions">
              <span>{selectedUsuariosIds.length} cuenta(s) seleccionada(s)</span>
              <button
                className="btn btn-outline-success btn-sm"
                type="button"
                onClick={() => seleccionarUsuariosEliminables(usuariosFiltrados)}
                disabled={usuariosEliminablesVisibles.length === 0 || deletingSelectedUsuarios}
              >
                Seleccionar eliminables
              </button>
              <button
                className="btn btn-outline-success btn-sm"
                type="button"
                onClick={limpiarSeleccionUsuarios}
                disabled={selectedUsuariosIds.length === 0 || deletingSelectedUsuarios}
              >
                Limpiar selección
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                type="button"
                onClick={eliminarUsuariosSeleccionados}
                disabled={selectedUsuariosIds.length === 0 || deletingSelectedUsuarios}
              >
                {deletingSelectedUsuarios ? "Eliminando..." : "Eliminar usuarios seleccionados"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="sin-resultados"><p>Cargando usuarios...</p></div>
          ) : usuarios.length === 0 ? (
            <div className="sin-resultados"><p>No hay usuarios registrados.</p></div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="sin-resultados"><p>No hay resultados para este filtro.</p></div>
          ) : (
            <div className="admin-users-layout">
              <div className="admin-users-list">
                {usuariosFiltrados.map((usuarioItem) => {
                  const datosAsociados = getDatosAsociadosUsuario(usuarioItem);
                  const usuarioActivo = isUsuarioActivo(usuarioItem);
                  const usuarioEliminable = esUsuarioEliminable(usuarioItem);
                  const usuarioSeleccionado = selectedUsuariosIds.includes(usuarioItem.id);

                  return (
                    <article
                      className={`admin-user-row ${selectedUsuario?.id === usuarioItem.id ? "active" : ""}`}
                      key={usuarioItem.id}
                    >
                      <label
                        className={`admin-user-select ${usuarioEliminable ? "" : "disabled"}`}
                        title={usuarioEliminable ? "Seleccionar cuenta" : "No se puede eliminar este usuario porque tiene información asociada o permisos administrativos"}
                      >
                        <input
                          type="checkbox"
                          checked={usuarioSeleccionado}
                          disabled={!usuarioEliminable || deletingSelectedUsuarios}
                          onChange={() => toggleUsuarioSeleccionado(usuarioItem)}
                        />
                        <span className="sr-only">Seleccionar usuario</span>
                      </label>
                      <button
                        className="admin-user-summary"
                        type="button"
                        onClick={() => setSelectedUsuarioId(usuarioItem.id)}
                      >
                        <span className="admin-user-avatar">
                          {(usuarioItem.nombre || usuarioItem.usuario || "U").slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{usuarioItem.nombre || usuarioItem.usuario}</strong>
                          <small>{usuarioItem.usuario} · {usuarioItem.correo || "Sin correo"}</small>
                        </span>
                      </button>
                      <div className="admin-user-badges">
                        <span className={`status-pill ${usuarioActivo ? "success" : "warning"}`}>
                          {usuarioActivo ? "Activa" : "Suspendida"}
                        </span>
                        <span className="status-pill">{getUsuarioRole(usuarioItem)}</span>
                        <span className="status-pill">{datosAsociados.total} datos asociados</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="admin-user-detail">
                {selectedUsuario ? (() => {
                  const datosAsociados = getDatosAsociadosUsuario(selectedUsuario);
                  const bloqueosEliminar = getBloqueosEliminarUsuario(selectedUsuario);
                  const usuarioActivo = isUsuarioActivo(selectedUsuario);
                  const isCurrentAdmin = selectedUsuario.id === user?.id;
                  const isAdminAccount = getUsuarioRole(selectedUsuario) === "ADMIN";
                  const actionDisabled = usuarioActionId === selectedUsuario.id;

                  return (
                    <>
                      <div className="section-heading-row">
                        <div>
                          <h4>Detalle de usuario</h4>
                          <span>ID #{selectedUsuario.id}</span>
                        </div>
                        <span className={`status-pill ${usuarioActivo ? "success" : "warning"}`}>
                          {selectedUsuario.estadoCuenta || (usuarioActivo ? "Activa" : "Suspendida")}
                        </span>
                      </div>

                      <div className="admin-user-account-section">
                        <h5>Datos de cuenta</h5>
                      </div>

                      <div className="admin-user-profile compact-admin-user-profile">
                        <span><strong>Nombre:</strong> {selectedUsuario.nombre || "No informado"}</span>
                        <span><strong>Usuario:</strong> {selectedUsuario.usuario}</span>
                        <span><strong>Correo:</strong> {selectedUsuario.correo || "No informado"}</span>
                        <span><strong>Teléfono:</strong> {selectedUsuario.telefono || "No informado"}</span>
                        <span><strong>Rol:</strong> {getUsuarioRole(selectedUsuario)}</span>
                        <span><strong>Estado de la cuenta:</strong> {usuarioActivo ? "Activa" : "Suspendida"}</span>
                      </div>

                      <div className="admin-user-associated">
                        <h5>Datos asociados</h5>
                        <div className="admin-user-associated-grid">
                          <span><strong>{datosAsociados.publicaciones}</strong> Publicaciones</span>
                          <span><strong>{datosAsociados.historias}</strong> Historias</span>
                          <span><strong>{datosAsociados.hogares}</strong> Hogares</span>
                          <span><strong>{datosAsociados.tareas}</strong> Tareas</span>
                        </div>
                        {datosAsociados.tieneDatos ? (
                          <p>
                            Este usuario tiene información asociada en la plataforma. Revisa sus publicaciones,
                            hogares o registros relacionados antes de eliminarlo.
                          </p>
                        ) : (
                          <p>No se detectaron datos asociados desde los registros cargados en el dashboard.</p>
                        )}
                      </div>

                      {bloqueosEliminar.length > 0 && (
                        <div className="admin-user-blockers" aria-label="Bloqueos para eliminar usuario">
                          <div>
                            <h5>Bloqueos para eliminar</h5>
                            <p>
                              Este usuario tiene información asociada. Revisa o gestiona estos datos antes de eliminar la cuenta.
                            </p>
                          </div>
                          <ul>
                            {bloqueosEliminar.map((bloqueo) => (
                              <li key={bloqueo.key}>
                                <span>{bloqueo.text}</span>
                                <button
                                  className="btn btn-outline-success btn-sm"
                                  type="button"
                                  onClick={() => irABloqueoUsuario(bloqueo.key, selectedUsuario, bloqueo.label)}
                                >
                                  {bloqueo.action}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="admin-user-actions">
                        {usuarioActivo ? (
                          <button
                            className="btn btn-outline-warning btn-sm"
                            type="button"
                            onClick={() => suspenderUsuarioAdmin(selectedUsuario)}
                            disabled={actionDisabled || isCurrentAdmin || isAdminAccount}
                          >
                            {actionDisabled ? "Procesando..." : "Suspender cuenta"}
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline-success btn-sm"
                            type="button"
                            onClick={() => reactivarUsuarioAdmin(selectedUsuario)}
                            disabled={actionDisabled}
                          >
                            {actionDisabled ? "Procesando..." : "Reactivar cuenta"}
                          </button>
                        )}
                        <button
                          className="btn btn-outline-success btn-sm"
                          type="button"
                          onClick={() => restablecerContrasenaAdmin(selectedUsuario)}
                          disabled={actionDisabled || isCurrentAdmin}
                        >
                          {actionDisabled ? "Procesando..." : "Restablecer contraseña"}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          type="button"
                          onClick={() => eliminarUsuarioAdmin(selectedUsuario)}
                          disabled={actionDisabled || isCurrentAdmin || isAdminAccount || datosAsociados.tieneDatos}
                          title={
                            datosAsociados.tieneDatos
                              ? "No se puede eliminar porque tiene información asociada"
                              : undefined
                          }
                        >
                          {actionDisabled ? "Procesando..." : "Eliminar usuario"}
                        </button>
                      </div>

                      {(isCurrentAdmin || isAdminAccount || datosAsociados.tieneDatos) && (
                        <p className="admin-user-warning">
                          {isCurrentAdmin
                            ? "No puedes eliminar ni suspender la cuenta administrativa actualmente activa."
                            : isAdminAccount
                              ? "Las cuentas ADMIN no se eliminan ni suspenden desde esta vista para proteger el acceso administrativo."
                              : "No se puede eliminar este usuario porque tiene información asociada. Revisa sus publicaciones, hogares o registros relacionados antes de continuar."}
                        </p>
                      )}
                    </>
                  );
                })() : (
                  <div className="sin-resultados"><p>Selecciona un usuario para ver su detalle.</p></div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
