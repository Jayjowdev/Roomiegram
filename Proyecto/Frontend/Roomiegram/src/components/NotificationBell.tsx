import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificacionService } from "../services/notificacionService";
import type { Notificacion } from "../types/Backend";

type NotificationBellProps = {
  className?: string;
  title?: string;
};

export function NotificationBell({ className = "", title = "Notificaciones" }: NotificationBellProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    notificacionService
      .listar()
      .then((data) => {
        if (isMounted) {
          setNotificaciones(data.filter((notificacion) => notificacion.usuarioReceptorId === user.id));
        }
      })
      .catch(() => {
        if (isMounted) setNotificaciones([]);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const pendientes = useMemo(() => {
    return notificaciones.filter((notificacion) => notificacion.estado === "PENDIENTE").length;
  }, [notificaciones]);

  const label = pendientes > 0
    ? `${title}: ${pendientes} pendiente${pendientes === 1 ? "" : "s"}`
    : title;

  return (
    <button
      type="button"
      className={`notification-bell ${pendientes > 0 ? "has-notifications" : ""} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={() => navigate("/notificaciones")}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {pendientes > 0 && <span className="notification-badge">{pendientes > 9 ? "9+" : pendientes}</span>}
    </button>
  );
}
