import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { register as registerRequest } from "../services/authService"

const registerSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa tu nombre completo"),
  correo: z.email("Ingresa un correo válido"),
  usuario: z.string().trim().min(3, "El usuario debe tener al menos 3 caracteres"),
  telefono: z.string().trim().min(8, "Ingresa un teléfono válido"),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState("")
  const [submitMessage, setSubmitMessage] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      usuario: "",
      telefono: "",
      contrasena: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError("")
    setSubmitMessage("")

    try {
      await registerRequest(values)
      setSubmitMessage("Cuenta creada correctamente. Ahora puedes iniciar sesión.")
      reset()
      navigate("/login")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear la cuenta")
    }
  }

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

        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>

          <input
            type="email"
            className="form-control"
            placeholder="Correo"
            {...register("correo")}
          />
          {errors.correo ? <p className="form-error">{errors.correo.message}</p> : null}

          <input
            type="password"
            className="form-control"
            placeholder="Contraseña"
            {...register("contrasena")}
          />
          {errors.contrasena ? <p className="form-error">{errors.contrasena.message}</p> : null}

          <input
            type="text"
            className="form-control"
            placeholder="Nombre completo"
            {...register("nombre")}
          />
          {errors.nombre ? <p className="form-error">{errors.nombre.message}</p> : null}

          <input
            type="text"
            className="form-control"
            placeholder="Nombre de usuario"
            {...register("usuario")}
          />
          {errors.usuario ? <p className="form-error">{errors.usuario.message}</p> : null}

          <input
            type="text"
            className="form-control"
            placeholder="Teléfono"
            {...register("telefono")}
          />
          {errors.telefono ? <p className="form-error">{errors.telefono.message}</p> : null}

          {submitError ? <p className="form-error">{submitError}</p> : null}
          {submitMessage ? <p className="form-success">{submitMessage}</p> : null}

          <button
            type="submit"
            className="btn btn-success w-100 mt-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="register-legal">
            Al registrarte aceptas nuestros términos y condiciones.
          </p>
        </form>
      </div>
    </div>
  )
}