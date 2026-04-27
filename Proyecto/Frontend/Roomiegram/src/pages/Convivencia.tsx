import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import img1 from "../assets/person1.jpeg";
import img2 from "../assets/person2.jpeg";
import img3 from "../assets/person3.jpeg";
import { useAuth } from "../context/AuthContext";

const roomies = [
  { nombre: "Sofía", detalle: "Arriendo al día", imagen: img1 },
  { nombre: "Camila", detalle: "Servicios pendientes", imagen: img2 },
  { nombre: "Daniela", detalle: "Turno de cocina", imagen: img3 },
];

export default function Convivencia() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/dashboard")}>Admin</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Inicio</button>
        </div>
      </header>

      <section className="dashboard-welcome">
        <h1>Panel de convivencia</h1>
        <p>Hola, {user?.nombre || user?.usuario || "usuario"}. Este es el espacio del hogar: tareas, pagos, acuerdos y actividad de tu grupo roomie.</p>
      </section>

      <section className="convivencia-grid">
        <div className="convivencia-main">
          <h3>Mi hogar actual</h3>
          <p>Depto compartido en Providencia · 3 integrantes</p>
          <div className="mi-grupo-grid">
            {roomies.map((roomie) => (
              <article className="mi-roomie-card" key={roomie.nombre}>
                <img src={roomie.imagen} alt={roomie.nombre} />
                <div><h3>{roomie.nombre}</h3><span>{roomie.detalle}</span></div>
              </article>
            ))}
          </div>
        </div>
        <aside className="convivencia-side">
          <article className="demo-widget highlight"><strong>Próxima tarea</strong><span>Limpieza cocina · Hoy</span></article>
          <article className="demo-widget"><strong>Gasto activo</strong><span>Internet · $12.990 por persona</span></article>
          <article className="demo-widget"><strong>Acuerdo del hogar</strong><span>Silencio desde las 23:00</span></article>
        </aside>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-activity">
          <h4>Acciones del hogar</h4>
          <div className="module-grid">
            <button className="module-link" onClick={() => navigate("/tareas")}><strong>Tareas del hogar</strong><span>Revisar turnos y responsables.</span></button>
            <button className="module-link" onClick={() => navigate("/gastos")}><strong>Gastos compartidos</strong><span>Ver cuentas y deudores.</span></button>
            <button className="module-link" onClick={() => navigate("/comprobantes")}><strong>Comprobantes</strong><span>Registrar pagos realizados.</span></button>
            <button className="module-link" onClick={() => navigate("/notificaciones")}><strong>Notificaciones</strong><span>Ver avisos del grupo.</span></button>
          </div>
        </div>
        <div className="dashboard-profile">
          <h4>Resumen rápido</h4>
          <p><strong>Tareas pendientes:</strong> 2</p>
          <p><strong>Gastos abiertos:</strong> 1</p>
          <p><strong>Compatibilidad grupo:</strong> 86%</p>
        </div>
      </section>
    </div>
  );
}
