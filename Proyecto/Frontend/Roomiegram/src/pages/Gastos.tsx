import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import type { CuentaDeudor, HogarCuenta } from "../types/Backend";
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
  return `Integrante #${usuarioId}`;
}

function formatCurrency(value?: number) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

function buildDeudores(ids: number[], monto: number): CuentaDeudor[] {
  const montoAdeudado = ids.length ? Math.round(monto / ids.length) : 0;
  return ids.map((usuarioId) => ({ usuarioId, montoAdeudado }));
}

export default function Gastos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [gastos, setGastos] = useState<HogarCuenta[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [deudoresIds, setDeudoresIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([hogarService.listar(), gastoService.listar()])
      .then(([hogaresResult, gastosResult]) => {
        setHogares(hogaresResult.status === "fulfilled" ? hogaresResult.value : []);
        setGastos(gastosResult.status === "fulfilled" ? gastosResult.value : []);

        if (hogaresResult.status === "rejected" || gastosResult.status === "rejected") {
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
            ) : gastosDelHogar.map((gasto) => (
              <article className="module-item" key={gasto.id}>
                <h4>{gasto.descripcion}</h4>
                <p>{formatCurrency(gasto.monto)}</p>
                <span>{gasto.deudores?.length || 0} deudor(es){gasto.montoPorPersona ? ` · ${formatCurrency(gasto.montoPorPersona)} por persona` : ""}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
