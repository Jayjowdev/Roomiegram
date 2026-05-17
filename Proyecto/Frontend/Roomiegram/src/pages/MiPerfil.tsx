import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import avatarUser from "../assets/avatarUser.svg";
import { useAuth } from "../context/AuthContext";

export default function MiPerfil() {
  const navigate = useNavigate();
  const { user, updateProfilePhoto } = useAuth();
  const [message, setMessage] = useState("");
  const profileImage = user?.fotoPerfil || avatarUser;

  const handleProfilePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Sube una imagen valida para tu perfil.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("La foto de perfil debe pesar menos de 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateProfilePhoto(reader.result).then(() => {
          setMessage("Foto de perfil actualizada.");
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/home")} />
        </div>

        <button className="btn btn-outline-success" onClick={() => navigate("/home")}>
          Volver al inicio
        </button>
      </header>

      {message && <p className="api-message">{message}</p>}

      <section className="mi-perfil-hero">
        <div className="mi-perfil-card">
          <div className="profile-photo-editor">
            <img src={profileImage} alt={user?.nombre || "Mi perfil"} />
            <label className="btn btn-outline-success">
              Cambiar foto
              <input type="file" accept="image/*" onChange={handleProfilePhoto} />
            </label>
          </div>
          <div>
            <span className="demo-kicker">Mi perfil</span>
            <h1>{user?.nombre || "Martina"}</h1>
            <p>{user?.descripcion || "Completa tu descripcion para que otros usuarios conozcan tu estilo de convivencia."}</p>
            {user?.intereses?.length ? (
              <div className="home-tags">
                {user.intereses.map((interes) => <span className="home-tag" key={interes}>{interes}</span>)}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="mi-perfil-summary">
          <h3>Compatibilidad activa</h3>
          <strong>0%</strong>
          <p>La compatibilidad se calculara cuando existan perfiles disponibles.</p>
          <button className="btn btn-success w-100" onClick={() => navigate("/compatibilidad")}>
            Buscar matches
          </button>
          <button className="btn btn-outline-success w-100 mt-2" onClick={() => navigate("/crear-publicacion")}>
            Crear publicacion
          </button>
        </aside>
      </section>

      <section className="mi-grupo">
        <div className="mi-grupo-header">
          <h2>Mi grupo roomie</h2>
          <button className="btn btn-outline-success" onClick={() => navigate("/convivencia")}>
            Ver panel convivencia
          </button>
        </div>

        <div className="sin-resultados"><p>Aun no hay integrantes registrados en tu hogar.</p></div>
      </section>
    </div>
  );
}
