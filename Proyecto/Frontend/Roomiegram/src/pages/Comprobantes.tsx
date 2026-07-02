import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
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
  return `$${Math.round(Number(value || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("es-CL") : "Sin fecha";
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
  const [hogarCuentaId, setHogarCuentaId] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gastoParam = params.get("gasto");
    if (gastoParam) setHogarCuentaId(gastoParam);
  }, [location.search]);

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

  const gastosDelHogar = useMemo(() => {
    if (!hogarActual?.hogarCuentaIds?.length) return [];
    return gastos.filter((gasto) => gasto.id && hogarActual.hogarCuentaIds.includes(gasto.id));
  }, [gastos, hogarActual]);

  const gastoIds = useMemo(() => gastosDelHogar.map((gasto) => gasto.id).filter((id): id is number => !!id), [gastosDelHogar]);

  const comprobantesDelHogar = useMemo(() => {
    return comprobantes.filter((comprobante) => gastoIds.includes(comprobante.hogarCuentaId));
  }, [comprobantes, gastoIds]);

  const canAssociateComprobante = isHogarAdmin(hogarActual, user?.id);
  const selectedGasto = gastosDelHogar.find((gasto) => String(gasto.id) === hogarCuentaId);
  const totalPagado = comprobantesDelHogar.reduce((total, comprobante) => total + Number(comprobante.montoPagado || 0), 0);

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
    if (Number(montoPagado) <= 0) return setMessage("El monto pagado debe ser mayor a cero.");
    if (nombreArchivo.trim().length < 3 || !nombreArchivo.includes(".")) {
      return setMessage("Ingresa un nombre de archivo válido con extensión.");
    }

    setIsSaving(true);
    try {
      const nombreArchivoLimpio = nombreArchivo.trim();
      const archivoBase64 = archivo
        ? await fileToBase64(archivo)
        : btoa(`Comprobante registrado desde frontend: ${nombreArchivoLimpio}`);

      const payload: Comprobante = {
        hogarCuentaId: Number(hogarCuentaId),
        usuarioId: user?.id || 1,
        nombreArchivo: nombreArchivoLimpio,
        tipoContenido: archivo?.type || "text/plain",
        tamanoArchivo: archivo?.size || nombreArchivoLimpio.length,
        montoPagado: Number(montoPagado),
        observacion: observacion.trim(),
        archivo: archivoBase64,
      };

      const creado = await comprobanteService.crear(payload);

      if (canAssociateComprobante && creado.id) {
        const hogarActualizado = await hogarService.agregarComprobante(hogarActual.id, {
          administradorId: user!.id,
          recursoId: creado.id,
        });
        setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
      }

      setComprobantes((current) => [creado, ...current.filter((item) => item.id !== creado.id)]);
      setMessage(canAssociateComprobante ? "Comprobante registrado y asociado al hogar." : "Comprobante registrado.");
      setHogarCuentaId("");
      setMontoPagado("");
      setNombreArchivo("");
      setObservacion("");
      setArchivo(null);
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
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/gastos")}>Gastos</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Comprobantes de pago</h1>
        <p>Sube respaldos de pagos asociados a los gastos del hogar y revisa lo registrado.</p>
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
        <>
          <section className="household-summary">
            <article className="household-stat">
              <span>Gastos con respaldo</span>
              <strong>{new Set(comprobantesDelHogar.map((comprobante) => comprobante.hogarCuentaId)).size}</strong>
            </article>
            <article className="household-stat">
              <span>Comprobantes</span>
              <strong>{comprobantesDelHogar.length}</strong>
            </article>
            <article className="household-stat">
              <span>Total pagado</span>
              <strong>{formatCurrency(totalPagado)}</strong>
            </article>
          </section>

          <section className="module-layout">
            <form className="module-form" onSubmit={handleSubmit}>
              <h3>Subir comprobante</h3>
              <select className="form-control" value={hogarCuentaId} onChange={(e) => setHogarCuentaId(e.target.value)} required>
                <option value="">Selecciona un gasto</option>
                {gastosDelHogar.map((gasto) => (
                  <option key={gasto.id} value={gasto.id}>{gasto.descripcion} - {formatCurrency(gasto.monto)}</option>
                ))}
              </select>
              {selectedGasto && (
                <p className="form-helper">
                  Gasto seleccionado: {selectedGasto.descripcion} por {formatCurrency(selectedGasto.monto)}
                </p>
              )}
              <input className="form-control" placeholder="Monto pagado" type="number" min="1" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} required />
              <label className="image-upload">
                <span>Archivo del comprobante</span>
                <input className="form-control" type="file" accept="image/*,.pdf" onChange={handleFileChange} />
              </label>
              <input className="form-control" placeholder="Nombre del archivo o comprobante" value={nombreArchivo} onChange={(e) => setNombreArchivo(e.target.value)} required />
              <textarea className="form-control" placeholder="Observación" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
              <button className="btn btn-success w-100" disabled={isSaving || gastosDelHogar.length === 0}>{isSaving ? "Registrando..." : "Registrar comprobante"}</button>
              {gastosDelHogar.length === 0 && <p className="form-helper">Primero registra un gasto del hogar.</p>}
            </form>

            <div className="module-list">
              <div className="section-heading-row">
                <h3>Comprobantes del hogar</h3>
                <button className="btn btn-outline-success btn-sm" onClick={() => navigate("/gastos")}>Ver gastos</button>
              </div>

              {comprobantesDelHogar.length === 0 ? (
                <div className="sin-resultados"><p>No hay comprobantes registrados para este hogar.</p></div>
              ) : comprobantesDelHogar.map((comprobante) => {
                const gasto = gastosDelHogar.find((item) => item.id === comprobante.hogarCuentaId);
                return (
                  <article className="module-item" key={comprobante.id || comprobante.nombreArchivo}>
                    <h4>{comprobante.nombreArchivo}</h4>
                    <p>{formatCurrency(comprobante.montoPagado)}</p>
                    <span>{gasto?.descripcion || "Gasto del hogar"} - Integrante del hogar - {formatDate(comprobante.fechaSubida)}</span>
                    {comprobante.observacion && <p>{comprobante.observacion}</p>}
                    <div className="item-actions">
                      <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarComprobante(comprobante)}>Eliminar</button>
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
