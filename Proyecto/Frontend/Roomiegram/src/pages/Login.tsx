import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import roomies from "../assets/login.png"
import { useAuth } from "../context/AuthContext"
import { login as loginRequest } from "../services/authService"

const loginSchema = z.object({
  usuario: z.string().trim().min(1, "Ingresa tu correo o usuario"),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [submitError, setSubmitError] = useState("")
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usuario: "",
      contrasena: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError("")

    try {
      const user = await loginRequest(values)
      login(user)
      navigate("/home")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo iniciar sesión")
    }
  }

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
        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <h2>Iniciar sesión</h2>

          <input
            className="form-control mb-2"
            placeholder="Correo o usuario"
            {...register("usuario")}
          />
          {errors.usuario ? <p className="form-error">{errors.usuario.message}</p> : null}

          <input
            className="form-control mb-2"
            type="password"
            placeholder="Contraseña"
            {...register("contrasena")}
          />
          {errors.contrasena ? <p className="form-error">{errors.contrasena.message}</p> : null}

          {submitError ? <p className="form-error">{submitError}</p> : null}

          <button
            type="submit"
            className="btn btn-success w-100 mb-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
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
        </form>
      </div>
    </div>
  )
}