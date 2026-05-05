import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import roomies from "../assets/login.png"

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="login-page">

      {/* HEADER */}
      <header className="login-header">
        <div className="login-header-left">
          <img
            src={logo}
            alt="RoomieGram"
            className="login-logo"
            onClick={() => navigate("/")}
          />
         
        </div>

        <button
          className="btn btn-outline-success"
          onClick={() => navigate("/register")}
        >
          Crear cuenta
        </button>
      </header>

      {/* CONTENT */}
      <div className="login-box">

        {/* IMAGEN */}
        <div className="login-image">
          <img src={roomies} alt="Roomies" />
        </div>

        {/* FORM */}
        <div className="login-form">
          <h2>Iniciar sesión</h2>

          <input
            className="form-control mb-3"
            placeholder="Correo o usuario"
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Contraseña"
          />

          <button
            className="btn btn-success w-100 mb-3"
            onClick={() => navigate("/home")}
          >
            Ingresar
          </button>

          {/* <button
            className="btn btn-outline-secondary w-100"
            onClick={() => navigate("/register")}
          >
            Crear una cuenta
          </button> */}

          <p className="login-legal">
            Al continuar aceptas nuestros términos y condiciones.
          </p>
        </div>
      </div>
    </div>
  )
}