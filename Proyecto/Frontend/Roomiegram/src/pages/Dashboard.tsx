import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";
import { gastoService } from "../services/gastoService";
import { hogarService } from "../services/hogarService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { tareaService } from "../services/tareaService";

type DashboardStats = {
  publicaciones: number;
  hogares: number;
  tareas: number;
  gastos: number;
  notificaciones: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    publicaciones: 0,
    hogares: 0,
    tareas: 0,
    gastos: 0,
    notificaciones: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      publicacionService.listar(),
      hogarService.listar(),
      tareaService.listar(),
      gastoService.listar(),
      notificacionService.listar(),
    ]).then(([publicaciones, hogares, tareas, gastos, notificaciones]) => {
      if (!isMounted) {
        return;
      }

      setStats({
        publicaciones: publicaciones.status === "fulfilled" ? publicaciones.value.length : 0,
        hogares: hogares.status === "fulfilled" ? hogares.value.length : 0,
        tareas: tareas.status === "fulfilled" ? tareas.value.length : 0,
        gastos: gastos.status === "fulfilled" ? gastos.value.length : 0,
        notificaciones: notificaciones.status === "fulfilled" ? notificaciones.value.length : 0,
      });

      if ([publicaciones, hogares, tareas, gastos, notificaciones].some((result) => result.status === "rejected")) {
        setMessage("Algunos servicios no están disponibles. El dashboard se mantiene operativo con datos parciales.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        </div>

        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>
            Panel convivencia
          </button>
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          <button className="btn btn-outline-dark" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="dashboard-welcome">
        <h1>Dashboard de administración</h1>
        <p>
          Hola, {user?.nombre || user?.usuario || "usuario"}. Administra módulos, publicaciones,
          hogares, tareas, gastos y notificaciones de RoomieGram.
        </p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="dashboard-stats">
        <button className="dashboard-card" onClick={() => navigate("/home")}>
          <h5>Publicaciones</h5>
          <h2>{stats.publicaciones}</h2>
        </button>
        <button className="dashboard-card" onClick={() => navigate("/hogares")}>
          <h5>Hogares</h5>
          <h2>{stats.hogares}</h2>
        </button>
        <button className="dashboard-card" onClick={() => navigate("/tareas")}>
          <h5>Tareas</h5>
          <h2>{stats.tareas}</h2>
        </button>
        <button className="dashboard-card" onClick={() => navigate("/gastos")}>
          <h5>Gastos</h5>
          <h2>{stats.gastos}</h2>
        </button>
        <button className="dashboard-card" onClick={() => navigate("/notificaciones")}>
          <h5>Notificaciones</h5>
          <h2>{stats.notificaciones}</h2>
        </button>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-activity">
          <h4>Gestión administrativa</h4>
          <div className="module-grid">
            <button className="module-link" onClick={() => navigate("/hogares")}>
              <strong>Administrar hogares</strong>
              <span>Crear hogares y revisar solicitudes de ingreso.</span>
            </button>
            <button className="module-link" onClick={() => navigate("/tareas")}>
              <strong>Administrar tareas</strong>
              <span>Crear y revisar tareas registradas.</span>
            </button>
            <button className="module-link" onClick={() => navigate("/gastos")}>
              <strong>Administrar gastos</strong>
              <span>Revisar cuentas compartidas y montos.</span>
            </button>
            <button className="module-link" onClick={() => navigate("/comprobantes")}>
              <strong>Administrar comprobantes</strong>
              <span>Registrar pagos asociados a gastos.</span>
            </button>
            <button className="module-link" onClick={() => navigate("/notificaciones")}>
              <strong>Administrar notificaciones</strong>
              <span>Crear y revisar avisos del sistema.</span>
            </button>
          </div>
        </div>

        <div className="dashboard-profile">
          <h4>Sesión administrativa</h4>
          <p>
            <strong>Nombre:</strong> {user?.nombre || "No informado"}
          </p>
          <p>
            <strong>Usuario:</strong> {user?.usuario || "No informado"}
          </p>
          <p>
            <strong>Rol:</strong> {user?.role || "CLIENTE"}
          </p>
        </div>
      </section>
    </div>
  );
}
