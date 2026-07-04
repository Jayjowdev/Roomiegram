import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LogoutButton() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  const displayName = user?.nombre || user?.usuario || "Usuario";

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen((prev) => !prev)}>
        <span className="user-menu-avatar">{displayName.charAt(0).toUpperCase()}</span>
        <span className="user-menu-name">{displayName}</span>
        <svg className={`user-menu-chevron${open ? " open" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-info">
            <span className="user-menu-info-name">{displayName}</span>
            {user?.correo && <span className="user-menu-info-email">{user.correo}</span>}
          </div>
          <div className="user-menu-divider" />
          <button className="user-menu-item danger" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
