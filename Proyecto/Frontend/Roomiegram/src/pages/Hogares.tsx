import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import type { Hogar } from "../types/Backend";

const hogaresDemo: Hogar[] = [
  { id: 1, nombre: "Depto Providencia", descripcion: "Hogar compartido cerca del metro.", usuarioCreadorId: 1, usuarioAdministradorId: 1, integrantesIds: [1, 2, 3], solicitudesPendientesIds: [4] },
  { id: 2, nombre: "Casa Nunoa", descripcion: "Casa tranquila con patio y espacios comunes.", usuarioCreadorId: 2, usuarioAdministradorId: 2, integrantesIds: [2, 5], solicitudesPendientesIds: [] },
];

export default function Hogares() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hogares, setHogares] = useState<Hogar[]>(hogaresDemo);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [usuarioSolicitud, setUsuarioSolicitud] = useState("4");
  const [message, setMessage] = useState("Mostrando hogares demo.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    hogarService
      .listar()
      .then((data) => {
        setHogares(data.length ? data : hogaresDemo);
        setMessage(data.length ? "" : "Mostrando hogares demo.");
      })
      .catch(() => setMessage("Mostrando hogares demo porque el servicio no esta disponible."));
  }, []);

  const updateHogar = (hogarActualizado: Hogar) => {
    setHogares((current) => current.map((hogar) => (hogar.id === hogarActualizado.id ? hogarActualizado : hogar)));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (nombre.trim().length < 3) {
      setMessage("El nombre del hogar debe tener al menos 3 caracteres.");
      return;
    }
    if (descripcion.trim() && descripcion.trim().length < 10) {
      setMessage("La descripcion debe tener al menos 10 caracteres o quedar vacia.");
      return;
    }

    setIsSaving(true);
    const nuevoHogar = { nombre: nombre.trim(), descripcion: descripcion.trim(), usuarioCreadorId: user?.id || 1 };

    try {
      const creado = await hogarService.crear(nuevoHogar);
      setHogares((current) => [...current, creado]);
      setMessage("Hogar creado correctamente.");
    } catch {
      setHogares((current) => [...current, { ...nuevoHogar, id: Date.now(), usuarioAdministradorId: user?.id || 1, integrantesIds: [user?.id || 1], solicitudesPendientesIds: [] }]);
      setMessage("Hogar agregado en modo demo.");
    } finally {
      setNombre("");
      setDescripcion("");
      setIsSaving(false);
    }
  };

  const solicitarIngreso = async (hogarId?: number) => {
    if (!hogarId) return;
    const usuarioId = Number(usuarioSolicitud || user?.id || 1);
    if (usuarioId <= 0) {
      setMessage("Ingresa un usuario valido para solicitar ingreso.");
      return;
    }

    try {
      const actualizado = await hogarService.solicitarIngreso(hogarId, { usuarioId });
      updateHogar(actualizado);
      setMessage("Solicitud enviada correctamente.");
    } catch {
      setHogares((current) => current.map((hogar) => hogar.id === hogarId ? { ...hogar, solicitudesPendientesIds: [...(hogar.solicitudesPendientesIds || []), usuarioId] } : hogar));
      setMessage("Solicitud agregada en modo demo.");
    } finally {
      setUsuarioSolicitud("");
    }
  };

  const aprobarSolicitud = (hogarId?: number, usuarioId?: number) => {
    if (!hogarId || !usuarioId) return;
    setHogares((current) => current.map((hogar) => hogar.id === hogarId ? {
      ...hogar,
      solicitudesPendientesIds: hogar.solicitudesPendientesIds?.filter((id) => id !== usuarioId),
      integrantesIds: [...(hogar.integrantesIds || []), usuarioId],
    } : hogar));
    setMessage("Solicitud aprobada.");
  };

  const rechazarSolicitud = (hogarId?: number, usuarioId?: number) => {
    if (!hogarId || !usuarioId) return;
    setHogares((current) => current.map((hogar) => hogar.id === hogarId ? {
      ...hogar,
      solicitudesPendientesIds: hogar.solicitudesPendientesIds?.filter((id) => id !== usuarioId),
    } : hogar));
    setMessage("Solicitud rechazada.");
  };

  const eliminarHogar = async (hogarId?: number) => {
    if (!hogarId) return;
    try {
      await hogarService.eliminar(hogarId, user?.id || 1);
      setMessage("Hogar eliminado correctamente.");
    } catch {
      setMessage("Hogar eliminado en modo demo.");
    } finally {
      setHogares((current) => current.filter((hogar) => hogar.id !== hogarId));
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
        <h1>Hogares</h1>
        <p>Crea hogares, revisa integrantes y gestiona solicitudes de ingreso.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="module-layout">
        <form className="module-form" onSubmit={handleSubmit}>
          <h3>Nuevo hogar</h3>
          <input className="form-control" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <textarea className="form-control" placeholder="Descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar hogar"}</button>
        </form>

        <div className="module-list">
          <h3>Hogares registrados</h3>
          <input className="form-control mb-3" placeholder="ID usuario para solicitar ingreso" type="number" min="1" value={usuarioSolicitud} onChange={(e) => setUsuarioSolicitud(e.target.value)} />

          {hogares.map((hogar) => (
            <article className="module-item" key={hogar.id || hogar.nombre}>
              <h4>{hogar.nombre}</h4>
              <p>{hogar.descripcion || "Sin descripcion"}</p>
              <span>{hogar.integrantesIds?.length || 0} integrante(s) - {hogar.solicitudesPendientesIds?.length || 0} solicitud(es)</span>
              <div className="item-actions">
                <button className="btn btn-outline-success btn-sm" onClick={() => solicitarIngreso(hogar.id)}>Solicitar ingreso</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarHogar(hogar.id)}>Eliminar</button>
              </div>
              {(hogar.solicitudesPendientesIds?.length || 0) > 0 && (
                <div className="home-tags mt-3">
                  {hogar.solicitudesPendientesIds?.map((usuarioId) => (
                    <span className="home-tag" key={usuarioId}>
                      Usuario {usuarioId}
                      <button className="tag-action" onClick={() => aprobarSolicitud(hogar.id, usuarioId)}>Aprobar</button>
                      <button className="tag-action" onClick={() => rechazarSolicitud(hogar.id, usuarioId)}>Rechazar</button>
                    </span>
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
