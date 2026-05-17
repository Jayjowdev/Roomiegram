import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { comprobanteService } from "../services/comprobanteService";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import type { Comprobante, HogarCuenta } from "../types/Backend";
import type { Hogar } from "../types/Hogar";

function userBelongsToHogar(hogar: Hogar, userId?: number) {
  if (!userId) return false;
  return hogar.integrantesIds?.includes(userId) || hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId;
}

function isHogarAdmin(hogar?: Hogar, userId?: number) {
  return !!hogar && !!userId && (hogar.usuarioAdministradorId === userId || hogar.usuarioCreadorId === userId);
}

function formatCurrency(value?: number) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

export default function Comprobantes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [gastos, setGastos] = useState<HogarCuenta[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [hogarCuentaId, setHogarCuentaId] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [observacion, setObservacion] = useState("");
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

  const gastosDelHogar = useMemo(() => {
    if (!hogarActual?.hogarCuentaIds?.length) return [];
    return gastos.filter((gasto) => gasto.id && hogarActual.hogarCuentaIds.includes(gasto.id));
  }, [gastos, hogarActual]);

  const canAssociateComprobante = isHogarAdmin(hogarActual, user?.id);

  const selectedGasto = gastosDelHogar.find((gasto) => String(gasto.id) === hogarCuentaId);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!hogarActual) return setMessage("Debes pertenecer a un hogar para registrar comprobantes.");
    if (Number(hogarCuentaId) <= 0) return setMessage("Selecciona un gasto del hogar.");
    if (Number(montoPagado) <= 0) return setMessage("El monto pagado debe ser mayor a cero.");
    if (nombreArchivo.trim().length < 3 || !nombreArchivo.includes(".")) {
      return setMessage("Ingresa un nombre de archivo válido con extensión.");
    }

    setIsSaving(true);
    const nombreArchivoLimpio = nombreArchivo.trim();
    const payload: Comprobante = {
      hogarCuentaId: Number(hogarCuentaId),
      usuarioId: user?.id || 1,
      nombreArchivo: nombreArchivoLimpio,
      tipoContenido: "text/plain",
      tamanoArchivo: nombreArchivoLimpio.length,
      montoPagado: Number(montoPagado),
      observacion: observacion.trim(),
      archivo: btoa(`Comprobante registrado desde frontend: ${nombreArchivoLimpio}`),
    };

    try {
      const creado = await comprobanteService.crear(payload);

      if (canAssociateComprobante) {
        const hogarActualizado = await hogarService.agregarComprobante(hogarActual.id, {
          administradorId: user!.id,
          recursoId: creado.id!,
        });
        setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      }

      setComprobantes((current) => [creado, ...current]);
      setMessage(
        canAssociateComprobante
          ? "Comprobante registrado y asociado al hogar."
          : "Comprobante registrado. La asociación al hogar queda disponible para el administrador."
      );
      setHogarCuentaId("");
      setMontoPagado("");
      setNombreArchivo("");
      setObservacion("");
    } catch {
      setMessage("No se pudo registrar el comprobante. Revisa que el servicio esté disponible.");
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
          <button className="btn btn-outline-success" onClick={() => navigate("/gastos")}>Gastos</button>
        </div>
      </header>

      <section className="module-title">
        <h1>Pagos y comprobantes</h1>
        <p>Registra pagos sobre gastos reales del hogar para dejar respaldo de la convivencia.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      {isLoading ? (
        <div className="sin-resultados"><p>Cargando gastos del hogar...</p></div>
      ) : !hogarActual ? (
        <div className="empty-household">
          <h2>Aún no tienes un hogar</h2>
          <p>Únete o crea un grupo roomie para registrar comprobantes de pagos compartidos.</p>
          <button className="btn btn-success" onClick={() => navigate("/hogares")}>Ir a mis hogares</button>
        </div>
      ) : (
        <section className="module-layout">
          <form className="module-form" onSubmit={handleSubmit}>
            <h3>Nuevo comprobante</h3>
            <select className="form-control" value={hogarCuentaId} onChange={(e) => setHogarCuentaId(e.target.value)} required>
              <option value="">Selecciona un gasto</option>
              {gastosDelHogar.map((gasto) => (
                <option key={gasto.id} value={gasto.id}>{gasto.descripcion} · {formatCurrency(gasto.monto)}</option>
              ))}
            </select>
            {selectedGasto && <p className="form-helper">Gasto seleccionado: {selectedGasto.descripcion}</p>}
            <input className="form-control" placeholder="Monto pagado" type="number" min="1" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} required />
            <input className="form-control" placeholder="Nombre del archivo o comprobante" value={nombreArchivo} onChange={(e) => setNombreArchivo(e.target.value)} required />
            <textarea className="form-control" placeholder="Observación" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
            <button className="btn btn-success w-100" disabled={isSaving || gastosDelHogar.length === 0}>{isSaving ? "Registrando..." : "Registrar comprobante"}</button>
          </form>

          <div className="module-list">
            <h3>Comprobantes registrados en esta sesión</h3>
            {gastosDelHogar.length === 0 && (
              <div className="sin-resultados"><p>Primero registra un gasto del hogar.</p></div>
            )}
            {comprobantes.length === 0 ? (
              <div className="sin-resultados"><p>No hay comprobantes recientes.</p></div>
            ) : comprobantes.map((comprobante) => (
              <article className="module-item" key={comprobante.id || comprobante.nombreArchivo}>
                <h4>{comprobante.nombreArchivo}</h4>
                <p>{formatCurrency(comprobante.montoPagado)}</p>
                <span>Gasto #{comprobante.hogarCuentaId} · Usuario #{comprobante.usuarioId}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
