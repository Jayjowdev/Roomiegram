import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { comprobanteService } from "../services/comprobanteService";
import type { Comprobante } from "../types/Backend";

const comprobantesDemo: Comprobante[] = [
  { id: 1, hogarCuentaId: 1, usuarioId: 1, nombreArchivo: "transferencia-internet.pdf", tipoContenido: "application/pdf", tamanoArchivo: 182000, montoPagado: 12990, observacion: "Pago internet abril", fechaSubida: "2026-04-26T19:00:00", archivo: "" },
];

export default function Comprobantes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comprobantes, setComprobantes] = useState<Comprobante[]>(comprobantesDemo);
  const [hogarCuentaId, setHogarCuentaId] = useState("1");
  const [montoPagado, setMontoPagado] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [message, setMessage] = useState("Mostrando comprobantes demo.");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (Number(hogarCuentaId) <= 0) {
      setMessage("Ingresa una cuenta del hogar valida.");
      return;
    }
    if (Number(montoPagado) <= 0) {
      setMessage("El monto pagado debe ser mayor a cero.");
      return;
    }
    if (nombreArchivo.trim().length < 3 || !nombreArchivo.includes(".")) {
      setMessage("Ingresa un nombre de archivo valido con extension.");
      return;
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
      setComprobantes((current) => [creado, ...current]);
      setMessage("Comprobante registrado correctamente.");
    } catch {
      setComprobantes((current) => [{ ...payload, id: Date.now(), fechaSubida: new Date().toISOString() }, ...current]);
      setMessage("Comprobante agregado en modo demo.");
    } finally {
      setHogarCuentaId("1");
      setMontoPagado("");
      setNombreArchivo("");
      setObservacion("");
      setIsSaving(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>Panel convivencia</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/dashboard")}>Admin</button>
        </div>
      </header>

      <section className="module-title">
        <h1>Pagos y comprobantes</h1>
        <p>Registra pagos asociados a una cuenta del hogar.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout">
        <form className="module-form" onSubmit={handleSubmit}>
          <h3>Nuevo comprobante</h3>
          <input className="form-control" placeholder="ID de cuenta del hogar" type="number" min="1" value={hogarCuentaId} onChange={(e) => setHogarCuentaId(e.target.value)} required />
          <input className="form-control" placeholder="Monto pagado" type="number" min="1" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} required />
          <input className="form-control" placeholder="Nombre del archivo" value={nombreArchivo} onChange={(e) => setNombreArchivo(e.target.value)} required />
          <textarea className="form-control" placeholder="Observacion" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
          <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Registrando..." : "Registrar comprobante"}</button>
        </form>

        <div className="module-list">
          <h3>Comprobantes recientes</h3>
          {comprobantes.map((comprobante) => (
            <article className="module-item" key={comprobante.id || comprobante.nombreArchivo}>
              <h4>{comprobante.nombreArchivo}</h4>
              <p>${Number(comprobante.montoPagado).toLocaleString("es-CL")}</p>
              <span>Cuenta {comprobante.hogarCuentaId} - Usuario {comprobante.usuarioId}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
