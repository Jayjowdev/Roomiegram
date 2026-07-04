import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LogoutButton() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.nombre || user?.usuario || "usuario";
  const initial = displayName.trim().charAt(0).toUpperCase() || "R";

  if (!user) {
    return (
      <button className="btn btn-outline-dark btn-logout" onClick={handleLogout}>
        Cerrar sesión
      </button>
    );
  }

  return (
    <div className="session-menu" aria-label={`Sesión iniciada como ${displayName}`}>
      <button className="session-user" type="button" onClick={() => navigate("/mi-perfil")}>
        <span className="session-avatar">
          {user.fotoPerfil ? <img src={user.fotoPerfil} alt="" /> : initial}
        </span>
        <span className="session-copy">
          <small>Sesión iniciada como</small>
          <strong>{displayName}</strong>
        </span>
      </button>
      <button className="btn btn-outline-dark btn-logout" type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
