import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { comprobanteService } from "../services/comprobanteService";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import { isPremiumHogar, membresiaService, type PlanId } from "../services/membresiaService";
import { usuarioService } from "../services/usuarioService";
import type { CategoriaGasto, Comprobante, CuentaDeudor, EstadoGasto, HogarCuenta } from "../types/Backend";
import type { Hogar } from "../types/Hogar";
import type { UsuarioResumen } from "../types/Usuario";

const CATEGORIAS_GASTO: Array<{ id: CategoriaGasto; label: string }> = [
  { id: "ARRIENDO", label: "Arriendo" },
  { id: "LUZ", label: "Luz" },
  { id: "AGUA", label: "Agua" },
  { id: "GAS", label: "Gas" },
  { id: "INTERNET", label: "Internet" },
  { id: "GASTO_COMUN", label: "Gasto común" },
  { id: "COMIDA", label: "Comida" },
  { id: "OTRO", label: "Otro" },
];

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

function formatMemberName(
  usuarioId: number,
  usuariosById: Map<number, UsuarioResumen>,
  currentUser?: { id: number; nombre?: string; usuario?: string },
) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tú";
  const usuario = usuariosById.get(usuarioId);
  if (usuario) return usuario.nombre || usuario.usuario;
  return "Integrante del hogar";
}

function formatCurrency(value?: number) {
  return `$${Math.round(Number(value || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
}

function formatDate(value?: string) {
  if (!value) return "Sin vencimiento";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getCurrentPeriod() {
  const formatter = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
  const value = formatter.format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCategoriaLabel(categoria?: CategoriaGasto) {
  return CATEGORIAS_GASTO.find((item) => item.id === (categoria || "OTRO"))?.label || "Otro";
}

function buildDeudores(ids: number[], monto: number): CuentaDeudor[] {
  const montoAdeudado = ids.length ? Math.round(monto / ids.length) : 0;
  return ids.map((usuarioId) => ({ usuarioId, montoAdeudado }));
}

function getEstadoRespaldo(monto: number, respaldado: number): EstadoGasto {
  if (respaldado <= 0) return "PENDIENTE";
  if (respaldado < monto) return "PARCIAL";
  return "RESPALDADO";
}

function getDetalleRespaldo(gasto: HogarCuenta, comprobantesDelHogar: Comprobante[]) {
  const comprobantesGasto = comprobantesDelHogar.filter((comprobante) => comprobante.hogarCuentaId === gasto.id);
  const respaldado = comprobantesGasto.reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const faltante = Math.max(0, Number(gasto.monto || 0) - respaldado);
  const estado = getEstadoRespaldo(Number(gasto.monto || 0), respaldado);

  return { comprobantesGasto, respaldado, faltante, estado };
}

function getResponsabilidadUsuario(gasto: HogarCuenta, comprobantesGasto: Comprobante[], usuarioId?: number) {
  const parteAsignada = gasto.deudores?.find((deudor) => deudor.usuarioId === usuarioId)?.montoAdeudado || 0;
  const respaldadoUsuario = comprobantesGasto
    .filter((comprobante) => comprobante.usuarioId === usuarioId)
    .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const faltanteUsuario = Math.max(0, Number(parteAsignada || 0) - respaldadoUsuario);

  return { parteAsignada: Number(parteAsignada || 0), respaldadoUsuario, faltanteUsuario };
}

export default function Gastos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [gastos, setGastos] = useState<HogarCuenta[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [categoria, setCategoria] = useState<CategoriaGasto>("ARRIENDO");
  const [descripcion, setDescripcion] = useState("");
  const [periodo, setPeriodo] = useState(getCurrentPeriod());
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [monto, setMonto] = useState("");
  const [deudoresIds, setDeudoresIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingGastoId, setDeletingGastoId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [planesIntegrantes, setPlanesIntegrantes] = useState<Record<number, PlanId>>({});

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

  const usuariosById = useMemo(() => {
    return new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }, [usuarios]);

  const gastosDelHogar = useMemo(() => {
    if (!hogarActual?.hogarCuentaIds?.length) return [];
    return gastos.filter((gasto) => gasto.id && hogarActual.hogarCuentaIds.includes(gasto.id));
  }, [gastos, hogarActual]);

  const gastoIds = useMemo(() => gastosDelHogar.map((gasto) => gasto.id).filter((id): id is number => !!id), [gastosDelHogar]);

  const comprobantesDelHogar = useMemo(() => {
    return comprobantes.filter((comprobante) => gastoIds.includes(comprobante.hogarCuentaId));
  }, [comprobantes, gastoIds]);

  const totalGastos = gastosDelHogar.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);
  const totalRespaldado = comprobantesDelHogar.reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
  const gastosPendientes = gastosDelHogar.filter((gasto) => {
    const respaldado = comprobantesDelHogar
      .filter((comprobante) => comprobante.hogarCuentaId === gasto.id)
      .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
    return getEstadoRespaldo(Number(gasto.monto || 0), respaldado) !== "RESPALDADO";
  }).length;
  const deudaUsuario = gastosDelHogar.reduce((total, gasto) => {
    const deuda = gasto.deudores?.find((deudor) => deudor.usuarioId === user?.id);
    return total + Number(deuda?.montoAdeudado || 0);
  }, 0);

  const canManage = isHogarAdmin(hogarActual, user?.id);
  const tienePremiumHogar = integrantes.some((usuarioId) => isPremiumHogar(planesIntegrantes[usuarioId]));

  const gastosConDetalle = useMemo(() => {
    return gastosDelHogar.map((gasto) => ({
      gasto,
      ...getDetalleRespaldo(gasto, comprobantesDelHogar),
    }));
  }, [comprobantesDelHogar, gastosDelHogar]);

  const gastosProgramados = useMemo(() => {
    return gastosConDetalle.filter(({ estado, faltante }) => estado !== "RESPALDADO" || faltante > 0);
  }, [gastosConDetalle]);

  const historialConComprobante = useMemo(() => {
    return gastosConDetalle.filter(
      ({ comprobantesGasto, estado, faltante }) => comprobantesGasto.length > 0 && estado === "RESPALDADO" && faltante === 0
    );
  }, [gastosConDetalle]);

  const arriendosDelHogar = useMemo(() => {
    return gastosConDetalle.filter(({ gasto }) => gasto.categoria === "ARRIENDO");
  }, [gastosConDetalle]);

  const otrosGastosProgramados = useMemo(() => {
    return gastosProgramados.filter(({ gasto }) => gasto.categoria !== "ARRIENDO");
  }, [gastosProgramados]);

  const historialOtrosGastos = useMemo(() => {
    return historialConComprobante.filter(({ gasto }) => gasto.categoria !== "ARRIENDO");
  }, [historialConComprobante]);

  const toggleDeudor = (usuarioId: number) => {
    setDeudoresIds((current) =>
      current.includes(usuarioId) ? current.filter((id) => id !== usuarioId) : [...current, usuarioId]
    );
  };

  const selectAllMembers = () => {
    setDeudoresIds(integrantes);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const montoNumerico = Number(monto);

    if (!hogarActual) return setMessage("Debes pertenecer a un hogar para crear gastos.");
    if (!canManage) return setMessage("Solo el administrador del hogar puede registrar gastos asociados al grupo.");
    if (descripcion.trim().length < 4) return setMessage("La descripción del gasto debe tener al menos 4 caracteres.");
    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) return setMessage("El monto debe ser mayor a cero.");
    if (deudoresIds.length === 0) return setMessage("Selecciona al menos un integrante responsable del gasto.");

    setIsSaving(true);

    try {
      const creado = await gastoService.crear({
        descripcion: descripcion.trim(),
        monto: montoNumerico,
        deudores: buildDeudores(deudoresIds, montoNumerico),
        categoria,
        periodo: periodo.trim(),
        fechaVencimiento: fechaVencimiento || undefined,
        estado: "PENDIENTE",
      });

      const hogarActualizado = await hogarService.agregarCuenta(hogarActual.id, {
        administradorId: user!.id,
        recursoId: creado.id!,
      });

      setGastos((current) => [...current, creado]);
      setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      setCategoria("ARRIENDO");
      setDescripcion("");
      setPeriodo(getCurrentPeriod());
      setFechaVencimiento("");
      setMonto("");
      setDeudoresIds([]);
      setMessage("Gasto común creado y asociado al hogar.");
    } catch {
      setMessage("No se pudo guardar el gasto. Revisa que los servicios estén disponibles.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGasto = async (gasto: HogarCuenta) => {
    if (!gasto.id || !canManage) return;

    const confirmed = window.confirm(`¿Eliminar el gasto "${gasto.descripcion}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingGastoId(gasto.id);
    setMessage("");

    try {
      await gastoService.eliminar(gasto.id);
      setGastos((current) => current.filter((item) => item.id !== gasto.id));
      setHogares((current) =>
        current.map((hogar) =>
          hogar.id === hogarActual?.id
            ? { ...hogar, hogarCuentaIds: (hogar.hogarCuentaIds || []).filter((id) => id !== gasto.id) }
            : hogar
        )
      );
      setMessage("Gasto eliminado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el gasto.");
    } finally {
      setDeletingGastoId(null);
    }
  };

  const renderArriendoCard = ({
    gasto,
    comprobantesGasto,
    respaldado,
    faltante,
    estado,
  }: (typeof gastosConDetalle)[number]) => {
    const esResponsableDelGasto = (gasto.deudores || []).some((deudor) => deudor.usuarioId === user?.id);

    return (
      <article className="module-item" key={`arriendo-${gasto.id}`}>
        <div className="section-heading-row">
          <h4>{gasto.descripcion}</h4>
          <span className={estado === "RESPALDADO" ? "status-pill success" : estado === "PARCIAL" ? "status-pill warning" : "status-pill"}>
            Estado documental: {ESTADO_LABELS[estado]}
          </span>
        </div>
        <div className="notification-context-grid mt-2">
          <span><strong>Periodo:</strong> {gasto.periodo || "Sin periodo"}</span>
          <span><strong>Vencimiento:</strong> {formatDate(gasto.fechaVencimiento)}</span>
          <span><strong>Monto total del arriendo:</strong> {formatCurrency(gasto.monto)}</span>
          <span><strong>Monto respaldado total:</strong> {formatCurrency(respaldado)}</span>
          <span><strong>Faltante por respaldar:</strong> {formatCurrency(faltante)}</span>
        </div>

        <div className="history-section">
          <h4>Responsables del arriendo</h4>
          <div className="notification-context-grid mt-2">
            {(gasto.deudores || []).map((deudor) => {
              const responsabilidad = getResponsabilidadUsuario(gasto, comprobantesGasto, deudor.usuarioId);

              return (
                <span key={`arriendo-${gasto.id}-${deudor.usuarioId}`}>
                  <strong>{formatMemberName(deudor.usuarioId, usuariosById, user || undefined)}</strong> | Asignado: {formatCurrency(responsabilidad.parteAsignada)} | Respaldado: {formatCurrency(responsabilidad.respaldadoUsuario)} | Falta: {formatCurrency(responsabilidad.faltanteUsuario)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="item-actions">
          {esResponsableDelGasto ? (
            <button className="btn btn-outline-success btn-sm" onClick={() => navigate(`/comprobantes?gastoId=${gasto.id}`)}>
              {estado === "RESPALDADO" ? "Ver comprobantes" : estado === "PARCIAL" ? "Ver avance y agregar comprobante" : "Subir comprobante"}
            </button>
          ) : (
            <span className="form-helper mb-0">Solo los responsables del arriendo pueden subir comprobantes.</span>
          )}
          {canManage && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => handleDeleteGasto(gasto)}
              disabled={deletingGastoId === gasto.id}
            >
              {deletingGastoId === gasto.id ? "Eliminando..." : "Eliminar gasto"}
            </button>
          )}
        </div>
      </article>
    );
  };

  const renderGastoCard = ({
    gasto,
    comprobantesGasto,
    respaldado,
    faltante,
    estado,
  }: (typeof gastosConDetalle)[number]) => {
    const deudaActual = gasto.deudores?.find((deudor) => deudor.usuarioId === user?.id)?.montoAdeudado || 0;
    const esResponsableDelGasto = (gasto.deudores || []).some((deudor) => deudor.usuarioId === user?.id);
    const responsabilidadUsuario = getResponsabilidadUsuario(gasto, comprobantesGasto, user?.id);
    const comprobanteActionLabel =
      estado === "RESPALDADO"
        ? "Ver comprobantes"
        : estado === "PARCIAL"
          ? "Ver avance y agregar comprobante"
          : "Subir comprobante";

    return (
      <article className="module-item" key={gasto.id}>
        <div className="section-heading-row">
          <h4>{getCategoriaLabel(gasto.categoria)} · {gasto.descripcion}</h4>
          <span className={estado === "RESPALDADO" ? "status-pill success" : estado === "PARCIAL" ? "status-pill warning" : "status-pill"}>
            Estado documental: {ESTADO_LABELS[estado]}
          </span>
        </div>
        <div className="notification-context-grid mt-2">
          <span><strong>Categoría:</strong> {getCategoriaLabel(gasto.categoria)}</span>
          <span><strong>Periodo:</strong> {gasto.periodo || "Sin periodo"}</span>
          <span><strong>Vencimiento:</strong> {formatDate(gasto.fechaVencimiento)}</span>
          <span><strong>Monto total:</strong> {formatCurrency(gasto.monto)}</span>
          <span><strong>Deuda asignada a ti:</strong> {formatCurrency(deudaActual)}</span>
          <span><strong>Comprobantes de este gasto:</strong> {comprobantesGasto.length}</span>
          <span><strong>Monto respaldado:</strong> {formatCurrency(respaldado)}</span>
          <span><strong>Faltante por respaldar:</strong> {formatCurrency(faltante)}</span>
        </div>
        {esResponsableDelGasto && (
          <div className="notification-context-grid mt-2">
            <span><strong>Tu responsabilidad</strong></span>
            <span><strong>Tu parte asignada:</strong> {formatCurrency(responsabilidadUsuario.parteAsignada)}</span>
            <span><strong>Ya respaldaste:</strong> {formatCurrency(responsabilidadUsuario.respaldadoUsuario)}</span>
            <span><strong>Te falta respaldar:</strong> {formatCurrency(responsabilidadUsuario.faltanteUsuario)}</span>
          </div>
        )}
        <div className="notification-context-grid mt-2">
          {(gasto.deudores || []).map((deudor) => (
            <span key={`${gasto.id}-${deudor.usuarioId}`}>
              <strong>{formatMemberName(deudor.usuarioId, usuariosById, user || undefined)}:</strong> deuda asignada {formatCurrency(deudor.montoAdeudado)}
            </span>
          ))}
        </div>
        {comprobantesGasto.length > 0 && (
          <div className="notification-context-grid mt-2">
            {comprobantesGasto.map((comprobante) => (
              <span key={comprobante.id || comprobante.nombreArchivo}>
                <strong>{comprobante.nombreArchivo}:</strong> {formatCurrency(comprobante.montoPagado)} respaldado
              </span>
            ))}
          </div>
        )}
        <div className="item-actions">
          {esResponsableDelGasto ? (
            <button className="btn btn-outline-success btn-sm" onClick={() => navigate(`/comprobantes?gastoId=${gasto.id}`)}>
              {comprobanteActionLabel}
            </button>
          ) : (
            <span className="form-helper mb-0">Solo los responsables del gasto pueden subir comprobantes.</span>
          )}
          {canManage && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => handleDeleteGasto(gasto)}
              disabled={deletingGastoId === gasto.id}
            >
              {deletingGastoId === gasto.id ? "Eliminando..." : "Eliminar gasto"}
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="module-page finance-module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/hogares")}>Mis hogares</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/comprobantes")}>Comprobantes</button>
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Gastos comunes del hogar</h1>
        <p>Organiza arriendo, servicios y gastos comunes. Roomiegram registra responsables y comprobantes, no transacciones bancarias.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <div className="sin-resultados"><p>Cargando gastos...</p></div>
      ) : !hogarActual ? (
        <div className="empty-household">
          <h2>Aún no tienes un hogar</h2>
          <p>Únete o crea un grupo roomie para organizar gastos compartidos.</p>
          <button className="btn btn-success" onClick={() => navigate("/hogares")}>Ir a mis hogares</button>
        </div>
      ) : (
        <>
          <section className="household-summary">
            {tienePremiumHogar ? (
              <>
            <article className="household-stat">
              <span>Total registrado en gastos</span>
              <strong>{formatCurrency(totalGastos)}</strong>
            </article>
            <article className="household-stat">
              <span>Tu parte asignada</span>
              <strong>{formatCurrency(deudaUsuario)}</strong>
            </article>
            <article className="household-stat">
              <span>Gastos sin respaldo completo</span>
              <strong>{gastosPendientes}</strong>
            </article>
            <article className="household-stat">
              <span>Monto respaldado con comprobantes</span>
              <strong>{formatCurrency(totalRespaldado)}</strong>
            </article>
              </>
            ) : (
              <>
                <article className="household-stat">
                  <span>Gastos registrados</span>
                  <strong>{gastosDelHogar.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Integrantes</span>
                  <strong>{integrantes.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Arriendos</span>
                  <strong>{arriendosDelHogar.length}</strong>
                </article>
                <article className="household-stat">
                  <span>Otros gastos activos</span>
                  <strong>{otrosGastosProgramados.length}</strong>
                </article>
              </>
            )}
          </section>
          <p className="form-helper">
            Resumen documental del hogar. No descuenta saldos individuales automáticamente.
          </p>

          <section className={`module-layout ${!canManage ? "single finance-history-layout" : ""}`}>
          {canManage && (
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Programar gasto compartido</h3>
            <p className="form-helper">Selecciona responsables del gasto. El monto se divide en partes iguales entre las personas marcadas.</p>
            {!canManage && <p className="form-helper">Solo el administrador del hogar puede registrar gastos asociados al grupo.</p>}
            <select className="form-control" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)} disabled={!canManage}>
              {CATEGORIAS_GASTO.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <input className="form-control" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required disabled={!canManage} />
            <input className="form-control" placeholder="Periodo, por ejemplo Julio 2026" value={periodo} onChange={(e) => setPeriodo(e.target.value)} disabled={!canManage} />
            <input className="form-control" type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} disabled={!canManage} />
            <input className="form-control" placeholder="Monto total" type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} required disabled={!canManage} />

            <div className="member-picker">
              <div className="section-heading-row">
                <h4>Responsables del gasto</h4>
                <button type="button" className="btn btn-outline-success btn-sm" onClick={selectAllMembers} disabled={!canManage}>Dividir entre todos</button>
              </div>
              {integrantes.map((usuarioId) => (
                <label className="member-check" key={usuarioId}>
                  <input type="checkbox" checked={deudoresIds.includes(usuarioId)} onChange={() => toggleDeudor(usuarioId)} disabled={!canManage} />
                  <span>{formatMemberName(usuarioId, usuariosById, user || undefined)}</span>
                </label>
              ))}
            </div>

            <button className="btn btn-success w-100" disabled={isSaving || !canManage}>{isSaving ? "Guardando..." : "Guardar gasto"}</button>
          </form>
          )}

          <div className="module-list">
            <h3>Arriendo del hogar</h3>
            <p className="form-helper">Seguimiento separado del arriendo para ver claramente cuánto corresponde y cuánto respaldó cada integrante.</p>
            {gastosDelHogar.length === 0 ? (
              <div className="sin-resultados"><p>No hay gastos asociados a este hogar.</p></div>
            ) : arriendosDelHogar.length === 0 ? (
              <div className="sin-resultados"><p>No hay arriendos registrados para este hogar.</p></div>
            ) : (
              arriendosDelHogar.map(renderArriendoCard)
            )}

            <div className="section-heading-row mt-4">
              <h3>Otros gastos programados</h3>
              <span className="status-pill">Sin arriendo</span>
            </div>
            <p className="form-helper">Internet, luz, agua, gas, comida y otros gastos con respaldo pendiente o parcial.</p>
            {otrosGastosProgramados.length === 0 ? (
              <div className="sin-resultados"><p>No hay otros gastos programados con respaldo pendiente.</p></div>
            ) : (
              otrosGastosProgramados.map(renderGastoCard)
            )}

            <div className="section-heading-row mt-4">
              <h3>Historial con comprobante</h3>
              <span className="status-pill success">Solo respaldados</span>
            </div>
            <p className="form-helper">Aquí aparecen otros gastos con estado documental respaldado y faltante por respaldar igual a cero.</p>
            {historialOtrosGastos.length === 0 ? (
              <div className="sin-resultados"><p>Aún no hay otros gastos completamente respaldados.</p></div>
            ) : (
              historialOtrosGastos.map(renderGastoCard)
            )}
          </div>
          </section>
        </>
      )}
    </div>
  );
}
