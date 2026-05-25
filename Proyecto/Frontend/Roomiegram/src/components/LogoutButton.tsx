import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <button className="btn btn-outline-dark" onClick={handleLogout}>
      Cerrar sesion
    </button>
  );
}
