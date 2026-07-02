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
import type { Comprobante, CuentaDeudor, HogarCuenta } from "../types/Backend";
import type { Hogar } from "../types/Hogar";

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return hogar.integrantesIds?.includes(userId) || hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId;
}

function isHogarAdmin(hogar?: Hogar, userId?: number) {
  return !!hogar && !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function formatMemberName(usuarioId: number, currentUser?: { id: number; nombre?: string; usuario?: string }) {
  if (usuarioId === currentUser?.id) return currentUser.nombre || currentUser.usuario || "Tú";
  return "Integrante del hogar";
}

function formatCurrency(value?: number) {
  return `$${Math.round(Number(value || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
}

function buildDeudores(ids: number[], monto: number): CuentaDeudor[] {
  const montoAdeudado = ids.length ? Math.round(monto / ids.length) : 0;
  return ids.map((usuarioId) => ({ usuarioId, montoAdeudado }));
}

function getEstadoRespaldo(monto: number, respaldado: number) {
  if (respaldado <= 0) return "Pendiente";
  if (respaldado < monto) return "Parcial";
  return "Respaldado";
}

export default function Gastos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [gastos, setGastos] = useState<HogarCuenta[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [deudoresIds, setDeudoresIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), gastoService.listar(), comprobanteService.listar()])
      .then(([hogaresResult, gastosResult, comprobantesResult]) => {
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setGastos(gastosResult.status === "fulfilled" ? gastosResult.value : []);
        setComprobantes(comprobantesResult.status === "fulfilled" ? comprobantesResult.value : []);

        if (hogaresResult.status === "rejected" || gastosResult.status === "rejected" || comprobantesResult.status === "rejected") {
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
  const deudaUsuario = gastosDelHogar.reduce((total, gasto) => {
    const deuda = gasto.deudores?.find((deudor) => deudor.usuarioId === user?.id);
    return total + Number(deuda?.montoAdeudado || 0);
  }, 0);

  const canManage = isHogarAdmin(hogarActual, user?.id);

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
    if (deudoresIds.length === 0) return setMessage("Selecciona al menos un integrante para dividir el gasto.");

    setIsSaving(true);

    try {
      const creado = await gastoService.crear({
        descripcion: descripcion.trim(),
        monto: montoNumerico,
        deudores: buildDeudores(deudoresIds, montoNumerico),
      });

      const hogarActualizado = await hogarService.agregarCuenta(hogarActual.id, {
        administradorId: user!.id,
        recursoId: creado.id!,
      });

      setGastos((current) => [...current, creado]);
      setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      setDescripcion("");
      setMonto("");
      setDeudoresIds([]);
      setMessage("Gasto creado y asociado al hogar.");
    } catch {
      setMessage("No se pudo guardar el gasto. Revisa que los servicios estén disponibles.");
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
          <button className="btn btn-outline-success" onClick={() => navigate("/comprobantes")}>Comprobantes</button>
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Gastos del hogar</h1>
        <p>Registra cuentas compartidas y divídelas entre integrantes del grupo roomie.</p>
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
            <article className="household-stat">
              <span>Total del hogar</span>
              <strong>{formatCurrency(totalGastos)}</strong>
            </article>
            <article className="household-stat">
              <span>Tu deuda registrada</span>
              <strong>{formatCurrency(deudaUsuario)}</strong>
            </article>
            <article className="household-stat">
              <span>Comprobantes asociados</span>
              <strong>{comprobantesDelHogar.length}</strong>
            </article>
            <article className="household-stat">
              <span>Respaldo registrado</span>
              <strong>{formatCurrency(totalRespaldado)}</strong>
            </article>
          </section>

          <section className="module-layout">
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Nuevo gasto</h3>
            {!canManage && <p className="form-helper">Solo el administrador del hogar puede registrar gastos asociados al grupo.</p>}
            <input className="form-control" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required disabled={!canManage} />
            <input className="form-control" placeholder="Monto" type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} required disabled={!canManage} />

            <div className="member-picker">
              <div className="section-heading-row">
                <h4>Dividir entre</h4>
                <button type="button" className="btn btn-outline-success btn-sm" onClick={selectAllMembers} disabled={!canManage}>Todos</button>
              </div>
              {integrantes.map((usuarioId) => (
                <label className="member-check" key={usuarioId}>
                  <input type="checkbox" checked={deudoresIds.includes(usuarioId)} onChange={() => toggleDeudor(usuarioId)} disabled={!canManage} />
                  <span>{formatMemberName(usuarioId, user || undefined)}</span>
                </label>
              ))}
            </div>

            <button className="btn btn-success w-100" disabled={isSaving || !canManage}>{isSaving ? "Guardando..." : "Guardar gasto"}</button>
          </form>

          <div className="module-list">
            <h3>Gastos de {hogarActual.nombre}</h3>
            {gastosDelHogar.length === 0 ? (
              <div className="sin-resultados"><p>No hay gastos asociados a este hogar.</p></div>
            ) : gastosDelHogar.map((gasto) => {
              const respaldado = comprobantesDelHogar
                .filter((comprobante) => comprobante.hogarCuentaId === gasto.id)
                .reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);
              const faltante = Math.max(0, Number(gasto.monto || 0) - respaldado);
              const estado = getEstadoRespaldo(Number(gasto.monto || 0), respaldado);

              return (
                <article className="module-item" key={gasto.id}>
                  <div className="section-heading-row">
                    <h4>{gasto.descripcion}</h4>
                    <span className={estado === "Respaldado" ? "status-pill success" : "status-pill"}>{estado}</span>
                  </div>
                  <p>{formatCurrency(gasto.monto)}</p>
                  <span>{gasto.deudores?.length || 0} deudor(es){gasto.montoPorPersona ? ` · ${formatCurrency(gasto.montoPorPersona)} por persona` : ""}</span>
                  <span>Respaldado: {formatCurrency(respaldado)} · Faltante: {formatCurrency(faltante)}</span>
                  <div className="item-actions">
                    <button className="btn btn-outline-success btn-sm" onClick={() => navigate(`/comprobantes?gasto=${gasto.id}`)}>
                      Subir comprobante
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          </section>
        </>
      )}
    </div>
  );
}
