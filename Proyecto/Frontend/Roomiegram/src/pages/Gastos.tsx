import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { gastoService } from "../services/gastoService";
import type { CuentaDeudor, HogarCuenta } from "../types/Backend";

const gastosDemo: HogarCuenta[] = [
  { id: 1, descripcion: "Internet abril", monto: 38970, montoPorPersona: 12990, deudores: [{ usuarioId: 1, montoAdeudado: 12990 }, { usuarioId: 2, montoAdeudado: 12990 }, { usuarioId: 3, montoAdeudado: 12990 }] },
  { id: 2, descripcion: "Compra supermercado", monto: 64500, montoPorPersona: 21500, deudores: [{ usuarioId: 1, montoAdeudado: 21500 }, { usuarioId: 2, montoAdeudado: 21500 }, { usuarioId: 3, montoAdeudado: 21500 }] },
];

function parseDeudores(value: string, monto: number): CuentaDeudor[] {
  const ids = value.split(",").map((id) => Number(id.trim())).filter((id) => Number.isFinite(id) && id > 0);
  const montoAdeudado = ids.length ? Math.round(monto / ids.length) : undefined;
  return ids.map((usuarioId) => ({ usuarioId, montoAdeudado }));
}

export default function Gastos() {
  const navigate = useNavigate();
  const [gastos, setGastos] = useState<HogarCuenta[]>(gastosDemo);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [deudores, setDeudores] = useState("1,2,3");
  const [message, setMessage] = useState("Mostrando gastos demo.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    gastoService
      .listar()
      .then((data) => {
        setGastos(data.length ? data : gastosDemo);
        setMessage(data.length ? "" : "Mostrando gastos demo.");
      })
      .catch(() => setMessage("Mostrando gastos demo porque el servicio no está disponible."));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const montoNumerico = Number(monto);
    const deudoresParseados = parseDeudores(deudores, montoNumerico);

    if (descripcion.trim().length < 4) {
      setMessage("La descripción del gasto debe tener al menos 4 caracteres.");
      return;
    }
    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      setMessage("El monto debe ser mayor a cero.");
      return;
    }
    if (deudores.trim() && deudoresParseados.length === 0) {
      setMessage("Ingresa IDs de deudores válidos separados por coma.");
      return;
    }

    setIsSaving(true);

    try {
      const creado = await gastoService.crear({ descripcion: descripcion.trim(), monto: montoNumerico, deudores: deudoresParseados });
      setGastos((current) => [...current, creado]);
      setMessage("Gasto creado correctamente.");
    } catch {
      setGastos((current) => [...current, { id: Date.now(), descripcion: descripcion.trim(), monto: montoNumerico, deudores: deudoresParseados, montoPorPersona: deudoresParseados[0]?.montoAdeudado }]);
      setMessage("Gasto agregado en modo demo.");
    } finally {
      setDescripcion("");
      setMonto("");
      setDeudores("1,2,3");
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
        <h1>Gestión de gastos</h1>
        <p>Registra cuentas compartidas para controlar montos y división de pagos.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout">
        <form className="module-form" onSubmit={handleSubmit}>
          <h3>Nuevo gasto</h3>
          <input className="form-control" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
          <input className="form-control" placeholder="Monto" type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          <input className="form-control" placeholder="IDs de deudores separados por coma" value={deudores} onChange={(e) => setDeudores(e.target.value)} />
          <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar gasto"}</button>
        </form>

        <div className="module-list">
          <h3>Gastos registrados</h3>
          {gastos.map((gasto) => (
            <article className="module-item" key={gasto.id || gasto.descripcion}>
              <h4>{gasto.descripcion}</h4>
              <p>${Number(gasto.monto).toLocaleString("es-CL")}</p>
              <span>{gasto.deudores?.length || 0} deudor(es){gasto.montoPorPersona ? ` · $${Number(gasto.montoPorPersona).toLocaleString("es-CL")} por persona` : ""}</span>
              {(gasto.deudores?.length || 0) > 0 && (
                <div className="home-tags mt-3">
                  {gasto.deudores?.map((deudor) => (
                    <span className="home-tag" key={deudor.id || deudor.usuarioId}>Usuario {deudor.usuarioId}{deudor.montoAdeudado ? `: $${Number(deudor.montoAdeudado).toLocaleString("es-CL")}` : ""}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
