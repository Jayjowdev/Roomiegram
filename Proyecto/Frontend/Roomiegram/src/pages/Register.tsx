import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"

export default function Register() {
  const navigate = useNavigate()

  return (
    <div className="register-page">

      {/* HEADER */}
      <header className="register-header">
        <div className="register-header-left">
          <img
            src={logo}
            alt="RoomieGram"
            className="register-logo"
            onClick={() => navigate("/")}
          />
         
        </div>

        <button
          className="btn btn-outline-success"
          onClick={() => navigate("/login")}
        >
          Ya tengo cuenta
        </button>
      </header>

      {/* CARD */}
      <div className="register-box">
        <h2>Crear cuenta</h2>

        <div className="register-form">

          <input
            type="text"
            className="form-control"
            placeholder="Correo o número de móvil"
          />

          <input
            type="password"
            className="form-control"
            placeholder="Contraseña"
          />

          <div className="register-date-row">
            <input className="form-control" placeholder="Día" />
            <input className="form-control" placeholder="Mes" />
            <input className="form-control" placeholder="Año" />
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="Nombre completo"
          />

          <input
            type="text"
            className="form-control"
            placeholder="Nombre de usuario"
          />

          <input
            type="text"
            className="form-control"
            placeholder="RUT"
          />

          <button
            className="btn btn-success w-100 mt-3"
            onClick={() => navigate("/home")}
          >
            Crear cuenta
          </button>

          <p className="register-legal">
            Al registrarte aceptas nuestros términos y condiciones.
          </p>
        </div>
      </div>
    </div>
  )
}