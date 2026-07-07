import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { comprobanteService } from "../services/comprobanteService";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import { isPremiumHogar, membresiaService, type PlanId } from "../services/membresiaService";
import { notificacionService } from "../services/notificacionService";
import { usuarioService } from "../services/usuarioService";
import type { CategoriaGasto, Comprobante, EstadoGasto, HogarCuenta } from "../types/Backend";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";

const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  ARRIENDO: "Arriendo",
  LUZ: "Luz",
  AGUA: "Agua",
  GAS: "Gas",
  INTERNET: "Internet",
  GASTO_COMUN: "Gasto común",
  COMIDA: "Comida",
  OTRO: "Otro",
};

const ESTADO_LABELS: Record<EstadoGasto, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  RESPALDADO: "Respaldado",
};

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return hogar.integrantesIds?.includes(userId) || hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId;
}

function isHogarAdmin(hogar?: Hogar, userId?: number) {
  return !!hogar && !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function formatCurrency(value?: number) {
  return `$${Math.round(Number(value || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("es-CL") : "Sin fecha";
}

function getShortDate(value?: string) {
  if (!value) return "Sin vencimiento";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getCategoriaLabel(categoria?: CategoriaGasto) {
  return CATEGORIA_LABELS[categoria || "OTRO"];
}

function getMemberName(usuarioId: number, usuariosById: Map<number, UsuarioResumen>, currentUser?: { id: number; nombre?: string; usuario?: string }) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "TÃº";
  const usuario = usuariosById.get(usuarioId);
  return usuario?.nombre || usuario?.usuario || "Integrante del hogar";
}

function getEstadoRespaldo(monto: number, respaldado: number): EstadoGasto {
  if (respaldado <= 0) return "PENDIENTE";
  if (respaldado < monto) return "PARCIAL";
  return "RESPALDADO";
}

function getResponsabilidadUsuario(gasto: HogarCuenta, comprobantesGasto: Comprobante[], usuarioId?: number) {
  const parteAsignada = gasto.deudores?.find((deudor) => deudor.usuarioId === usuarioId)?.montoAdeudado || 0;
  const respaldadoUsuario = comprobantesGasto
    .filter((comprobante) => comprobante.usuarioId === usuarioId)
    .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const faltanteUsuario = Math.max(0, Number(parteAsignada || 0) - respaldadoUsuario);

  return { parteAsignada: Number(parteAsignada || 0), respaldadoUsuario, faltanteUsuario };
}

function getComprobanteUrl(comprobante: Comprobante) {
  if (!comprobante.archivo) return "";
  return comprobante.archivo.startsWith("data:")
    ? comprobante.archivo
    : `data:${comprobante.tipoContenido};base64,${comprobante.archivo}`;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export default function Comprobantes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [gastos, setGastos] = useState<HogarCuenta[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [hogarCuentaId, setHogarCuentaId] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [nombreComprobante, setNombreComprobante] = useState("");
  const [observacion, setObservacion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [planesIntegrantes, setPlanesIntegrantes] = useState<Record<number, PlanId>>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gastoParam = params.get("gastoId") || params.get("gasto");
    if (gastoParam) setHogarCuentaId(gastoParam);
    else setHogarCuentaId("");
  }, [location.search]);

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), gastoService.listar(), comprobanteService.listar(), usuarioService.listar()])
      .then(([hogaresResult, gastosResult, comprobantesResult, usuariosResult]) => {
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setGastos(gastosResult.status === "fulfilled" ? gastosResult.value : []);
        setComprobantes(comprobantesResult.status === "fulfilled" ? comprobantesResult.value : []);
        setUsuarios(usuariosResult.status === "fulfilled" ? usuariosResult.value : []);

        if (hogaresResult.status === "rejected" || gastosResult.status === "rejected" || comprobantesResult.status === "rejected" || usuariosResult.status === "rejected") {
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

  const gastosDelHogar = useMemo(() => {
    if (!hogarActual?.hogarCuentaIds?.length) return [];
    return gastos.filter((gasto) => gasto.id && hogarActual.hogarCuentaIds.includes(gasto.id));
  }, [gastos, hogarActual]);

  const gastoIds = useMemo(() => gastosDelHogar.map((gasto) => gasto.id).filter((id): id is number => !!id), [gastosDelHogar]);

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const comprobantesDelHogar = useMemo(() => {
    return comprobantes.filter((comprobante) => gastoIds.includes(comprobante.hogarCuentaId));
  }, [comprobantes, gastoIds]);

  const canAssociateComprobante = isHogarAdmin(hogarActual, user?.id);
  const tienePremiumHogar = integrantes.some((usuarioId) => isPremiumHogar(planesIntegrantes[usuarioId]));
  const selectedGasto = gastosDelHogar.find((gasto) => String(gasto.id) === hogarCuentaId);
  const totalPagado = comprobantesDelHogar.reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const totalGastos = gastosDelHogar.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);
  const totalFaltante = Math.max(0, totalGastos - totalPagado);
  const comprobantesDelGastoSeleccionado = selectedGasto
    ? comprobantesDelHogar.filter((comprobante) => comprobante.hogarCuentaId === selectedGasto.id)
    : [];
  const totalPagadoSeleccionado = comprobantesDelGastoSeleccionado.reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const faltanteSeleccionado = selectedGasto ? Math.max(0, Number(selectedGasto.monto || 0) - totalPagadoSeleccionado) : 0;
  const estadoSeleccionado = selectedGasto ? getEstadoRespaldo(Number(selectedGasto.monto || 0), totalPagadoSeleccionado) : "";
  const responsabilidadUsuario = selectedGasto
    ? getResponsabilidadUsuario(selectedGasto, comprobantesDelGastoSeleccionado, user?.id)
    : { parteAsignada: 0, respaldadoUsuario: 0, faltanteUsuario: 0 };
  const usuarioEsResponsableDelGasto = selectedGasto
    ? (selectedGasto.deudores || []).some((deudor) => deudor.usuarioId === user?.id)
    : false;
  const canSubmitComprobante = !!selectedGasto && usuarioEsResponsableDelGasto;
  const isFocusedUploadMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.has("gastoId") || params.has("gasto");
  }, [location.search]);
  const showCreatedMessage = useMemo(() => {
    return new URLSearchParams(location.search).get("creado") === "1";
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const comprobanteParam = params.get("comprobante");
    if (!comprobanteParam || hogarCuentaId) return;

    const comprobante = comprobantesDelHogar.find((item) => String(item.id) === comprobanteParam);
    if (comprobante) setHogarCuentaId(String(comprobante.hogarCuentaId));
  }, [comprobantesDelHogar, hogarCuentaId, location.search]);

  useEffect(() => {
    if (!isFocusedUploadMode || !canSubmitComprobante || montoPagado || responsabilidadUsuario.faltanteUsuario <= 0) return;
    setMontoPagado(String(Math.round(responsabilidadUsuario.faltanteUsuario)));
  }, [canSubmitComprobante, isFocusedUploadMode, montoPagado, responsabilidadUsuario.faltanteUsuario]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setMessage("El comprobante debe pesar menos de 3 MB.");
      return;
    }

    setArchivo(file);
    setNombreArchivo(file.name);
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!hogarActual) return setMessage("Debes pertenecer a un hogar para registrar comprobantes.");
    if (Number(hogarCuentaId) <= 0) return setMessage("Selecciona un gasto del hogar.");
    if (!selectedGasto) return setMessage("Selecciona un gasto registrado del hogar.");
    if (!usuarioEsResponsableDelGasto) return setMessage("Solo los responsables de este gasto pueden subir comprobantes.");
    if (Number(montoPagado) <= 0) return setMessage("El monto respaldado debe ser mayor a cero.");
    if (!archivo) return setMessage("Selecciona una imagen o PDF como comprobante.");

    setIsSaving(true);
    try {
      const nombreArchivoLimpio = nombreComprobante.trim() || archivo.name;
      const archivoBase64 = await fileToBase64(archivo);

      const payload: Comprobante = {
        hogarCuentaId: Number(hogarCuentaId),
        usuarioId: user?.id || 1,
        nombreArchivo: nombreArchivoLimpio,
        tipoContenido: archivo.type || "application/octet-stream",
        tamanoArchivo: archivo.size,
        montoPagado: Number(montoPagado),
        observacion: observacion.trim(),
        archivo: archivoBase64,
      };

      const creado = await comprobanteService.crear(payload);
      const gastoAsociado = gastosDelHogar.find((gasto) => gasto.id === Number(hogarCuentaId));
      let avisoAdministradorFallido = false;

      if (canAssociateComprobante && creado.id) {
        const hogarActualizado = await hogarService.agregarComprobante(hogarActual.id, {
          administradorId: user!.id,
          recursoId: creado.id,
        });
        setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      }

      const administradorId = hogarActual.usuarioAdministradorId || hogarActual.usuarioCreadorId;
      if (administradorId && user?.id && administradorId !== user.id && creado.id) {
        try {
          await notificacionService.crear({
            usuarioEmisorId: user.id,
            usuarioReceptorId: administradorId,
            hogarId: hogarActual.id,
            referenciaId: creado.id,
            tipo: "CUENTA_HOGAR",
            estado: "PENDIENTE",
            titulo: "Nuevo comprobante del hogar",
            mensaje: `${user.nombre || user.usuario} subió un comprobante para ${gastoAsociado ? `${getCategoriaLabel(gastoAsociado.categoria)} - ${gastoAsociado.periodo || gastoAsociado.descripcion}` : nombreArchivoLimpio}.`,
          });
        } catch {
          avisoAdministradorFallido = true;
        }
      }

      setComprobantes((current) => [creado, ...current.filter((item) => item.id !== creado.id)]);
      setMessage(
        avisoAdministradorFallido
          ? "Comprobante registrado. No se pudo enviar el aviso al administrador."
          : canAssociateComprobante ? "Comprobante registrado y asociado al hogar." : "Comprobante registrado.",
      );
      if (!isFocusedUploadMode) setHogarCuentaId("");
      setMontoPagado("");
      setNombreArchivo("");
      setNombreComprobante("");
      setObservacion("");
      setArchivo(null);
      if (isFocusedUploadMode) navigate("/comprobantes?creado=1");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar el comprobante.");
    } finally {
      setIsSaving(false);
    }
  };

  const eliminarComprobante = async (comprobante: Comprobante) => {
    if (!comprobante.id) return;

    try {
      await comprobanteService.eliminar(comprobante.id);
      setMessage("Comprobante eliminado correctamente.");
      setComprobantes((current) => current.filter((item) => item.id !== comprobante.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el comprobante.");
    }
  };

  return (
    <div className="module-page finance-module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/gastos")}>Gastos</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>{isFocusedUploadMode ? "Subir comprobante" : "Comprobantes del hogar"}</h1>
        <p>
          {isFocusedUploadMode
            ? "Registra el respaldo de este gasto específico del hogar."
            : "Revisa imágenes o PDF asociados a gastos específicos del hogar. Roomiegram organiza comprobantes, no procesa pagos."}
        </p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <div className="sin-resultados"><p>Cargando gastos del hogar...</p></div>
      ) : !hogarActual ? (
        <div className="empty-household">
          <h2>Aún no tienes un hogar</h2>
          <p>Únete o crea un grupo roomie para registrar comprobantes de gastos compartidos.</p>
          <button className="btn btn-success" onClick={() => navigate("/hogares")}>Ir a mis hogares</button>
        </div>
      ) : (
        <>
          {showCreatedMessage && <p className="api-message">Comprobante registrado correctamente. Ya aparece en el historial del hogar.</p>}

          {!isFocusedUploadMode && (
          <section className="household-summary">
            {tienePremiumHogar ? (
              <>
            <article className="household-stat">
              <span>Gastos con respaldo</span>
              <strong>{new Set(comprobantesDelHogar.map((comprobante) => comprobante.hogarCuentaId)).size}</strong>
            </article>
            <article className="household-stat">
              <span>Comprobantes</span>
              <strong>{comprobantesDelHogar.length}</strong>
            </article>
            <article className="household-stat">
              <span>Monto respaldado</span>
              <strong>{formatCurrency(totalPagado)}</strong>
            </article>
            <article className="household-stat">
              <span>Faltante por respaldar</span>
              <strong>{formatCurrency(totalFaltante)}</strong>
            </article>
              </>
            ) : (
              <>
                <article className="household-stat">
                  <span>Comprobantes</span>
                  <strong>{comprobantesDelHogar.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Gastos del hogar</span>
                  <strong>{gastosDelHogar.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Integrantes</span>
                  <strong>{integrantes.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Gastos con respaldo</span>
                  <strong>{new Set(comprobantesDelHogar.map((comprobante) => comprobante.hogarCuentaId)).size}</strong>
                </article>
              </>
            )}
          </section>
          )}

          <section className={`module-layout single ${isFocusedUploadMode ? "finance-upload-layout" : "finance-history-layout"}`}>
            {isFocusedUploadMode && !selectedGasto && (
              <div className="empty-household">
                <h2>Gasto no encontrado</h2>
                <p>No pudimos encontrar el gasto seleccionado para registrar el comprobante.</p>
                <button className="btn btn-success" onClick={() => navigate("/gastos")}>Volver a gastos</button>
              </div>
            )}

            {isFocusedUploadMode && selectedGasto && !usuarioEsResponsableDelGasto && (
              <div className="empty-household">
                <h2>Comprobante no disponible</h2>
                <p>Solo los responsables del gasto pueden subir comprobantes.</p>
                <button className="btn btn-success" onClick={() => navigate("/gastos")}>Volver a gastos</button>
              </div>
            )}

            {isFocusedUploadMode && canSubmitComprobante && (
            <form className="module-form" onSubmit={handleSubmit}>
              <h3>Subir comprobante</h3>
              <p className="form-helper">Registra el respaldo documental para este gasto. Roomiegram no procesa pagos bancarios.</p>
              {selectedGasto && (
                <>
                  <div className="household-summary">
                    <article className="household-stat">
                      <span>Tu parte asignada</span>
                      <strong>{formatCurrency(responsabilidadUsuario.parteAsignada)}</strong>
                    </article>
                    <article className="household-stat">
                      <span>Ya respaldaste</span>
                      <strong>{formatCurrency(responsabilidadUsuario.respaldadoUsuario)}</strong>
                    </article>
                    <article className="household-stat">
                      <span>Te falta respaldar</span>
                      <strong>{formatCurrency(responsabilidadUsuario.faltanteUsuario)}</strong>
                    </article>
                  </div>
                  <div className="notification-context-grid">
                    <span><strong>Monto total del gasto:</strong> {formatCurrency(selectedGasto.monto)}</span>
                    <span><strong>Estado documental:</strong> {ESTADO_LABELS[estadoSeleccionado as EstadoGasto]}</span>
                    <span><strong>Periodo:</strong> {selectedGasto.periodo || "Sin periodo"}</span>
                    <span><strong>Vencimiento:</strong> {getShortDate(selectedGasto.fechaVencimiento)}</span>
                    <span><strong>Monto respaldado del gasto:</strong> {formatCurrency(totalPagadoSeleccionado)}</span>
                    <span><strong>Faltante total del gasto:</strong> {formatCurrency(faltanteSeleccionado)}</span>
                  </div>
                  <div className="notification-context-grid">
                    {(selectedGasto.deudores || []).map((deudor) => (
                      <span key={`${selectedGasto.id}-${deudor.usuarioId}`}>
                        <strong>{getMemberName(deudor.usuarioId, usuariosById, user || undefined)}:</strong> {formatCurrency(deudor.montoAdeudado)}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <input className="form-control" placeholder="Nombre del comprobante" value={nombreComprobante} onChange={(e) => setNombreComprobante(e.target.value)} />
              <input className="form-control" placeholder="Monto respaldado" type="number" min="1" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} required />
              <label className="image-upload">
                <span>Archivo del comprobante</span>
                <input className="form-control" type="file" accept="image/*,.pdf" onChange={handleFileChange} />
              </label>
              {nombreArchivo && <p className="form-helper">Archivo seleccionado: {nombreArchivo}</p>}
              <textarea className="form-control" placeholder="Observación" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
              <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Registrando..." : "Registrar comprobante"}</button>
              <button className="btn btn-outline-success w-100" type="button" onClick={() => navigate("/gastos")}>Volver a gastos</button>
            </form>
            )}

            {!isFocusedUploadMode && (
            <div className="module-list">
              <div className="section-heading-row">
                <h3>Comprobantes del hogar</h3>
                <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/gastos")}>Ver gastos</button>
              </div>
              <p className="form-helper">Cada comprobante queda ligado al gasto seleccionado y suma como respaldo documental.</p>

              {comprobantesDelHogar.length === 0 ? (
                <div className="sin-resultados"><p>No hay comprobantes registrados para este hogar.</p></div>
              ) : comprobantesDelHogar.map((comprobante) => {
                const gasto = gastosDelHogar.find((item) => item.id === comprobante.hogarCuentaId);
                const comprobanteUrl = getComprobanteUrl(comprobante);
                const esImagen = comprobante.tipoContenido?.startsWith("image/");
                const esPdf = comprobante.tipoContenido === "application/pdf";
                return (
                  <article className="module-item" key={comprobante.id || comprobante.nombreArchivo}>
                    <h4>{comprobante.nombreArchivo}</h4>
                    <p>Monto respaldado: {formatCurrency(comprobante.montoPagado)}</p>
                    <span>{gasto ? `${getCategoriaLabel(gasto.categoria)} · ${gasto.descripcion}` : "Gasto del hogar"} - {getMemberName(comprobante.usuarioId, usuariosById, user || undefined)} - {formatDate(comprobante.fechaSubida)}</span>
                    {gasto?.periodo && <span>Periodo: {gasto.periodo}</span>}
                    {comprobante.observacion && <p>{comprobante.observacion}</p>}
                    {esImagen && comprobanteUrl && (
                      <button className="image-upload comprobante-preview" type="button" onClick={() => window.open(comprobanteUrl, "_blank", "noopener,noreferrer")}>
                        <img src={comprobanteUrl} alt={comprobante.nombreArchivo} />
                      </button>
                    )}
                    <div className="item-actions">
                      {comprobanteUrl && (
                        <button
                          className="btn btn-outline-success btn-sm"
                          type="button"
                          onClick={() => window.open(comprobanteUrl, "_blank", "noopener,noreferrer")}
                        >
                          {esPdf ? "Abrir PDF" : "Ver comprobante"}
                        </button>
                      )}
                      <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarComprobante(comprobante)}>Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
