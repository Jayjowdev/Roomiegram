import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { useAuth } from "../context/AuthContext"
import { crearHogar, listarHogares, solicitarIngresoHogar } from "../services/hogarService"
import type { Hogar } from "../types/Hogar"

const hogarSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa un nombre para el hogar"),
  descripcion: z.string().trim().min(10, "Describe el hogar con más detalle"),
})

type HogarFormInput = z.input<typeof hogarSchema>
type HogarFormValues = z.output<typeof hogarSchema>

export default function Hogares() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [hogares, setHogares] = useState<Hogar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [actionError, setActionError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HogarFormInput, unknown, HogarFormValues>({
    resolver: zodResolver(hogarSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  })

  async function loadHogares() {
    setFetchError("")

    try {
      const response = await listarHogares()
      setHogares(response)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar los hogares")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadHogares()
  }, [])

  async function onSubmit(values: HogarFormValues) {
    if (!user) {
      setSubmitError("Debes iniciar sesión para crear un hogar")
      return
    }

    setSubmitError("")

    try {
      await crearHogar({
        ...values,
        usuarioCreadorId: user.id,
      })
      reset()
      await loadHogares()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear el hogar")
    }
  }

  async function handleSolicitarIngreso(hogarId: number) {
    if (!user) {
      setActionError("Debes iniciar sesión para enviar la solicitud")
      return
    }

    setActionError("")

    try {
      await solicitarIngresoHogar(hogarId, user.id)
      await loadHogares()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo solicitar el ingreso")
    }
  }

  return (
    <div className="feature-page">
      <header className="feature-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/dashboard")} />

        <div className="feature-header-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Publicaciones</button>
          <button className="btn btn-success" onClick={() => navigate("/dashboard")}>Dashboard</button>
        </div>
      </header>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Crear hogar</h2>
            <p>Este formulario valida nombre y descripción antes de llamar al microservicio de hogares.</p>
          </div>
        </div>

        <form className="feature-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="feature-grid">
            <div>
              <label className="feature-label">Nombre del hogar</label>
              <input className="form-control" {...register("nombre")} />
              {errors.nombre ? <p className="form-error">{errors.nombre.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Descripción</label>
              <textarea className="form-control feature-textarea" rows={3} {...register("descripcion")} />
              {errors.descripcion ? <p className="form-error">{errors.descripcion.message}</p> : null}
            </div>
          </div>

          {submitError ? <p className="form-error">{submitError}</p> : null}

          <div className="feature-actions">
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Crear hogar"}
            </button>
          </div>
        </form>
      </section>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Hogares disponibles</h2>
            <p>Lista sincronizada con `GET /hogares`.</p>
          </div>
        </div>

        {actionError ? <p className="form-error">{actionError}</p> : null}
        {isLoading ? <div className="feature-empty">Cargando hogares...</div> : null}
        {!isLoading && fetchError ? <div className="feature-empty">{fetchError}</div> : null}
        {!isLoading && !fetchError && hogares.length === 0 ? <div className="feature-empty">No hay hogares registrados.</div> : null}

        {!isLoading && !fetchError && hogares.length > 0 ? (
          <div className="feature-list">
            {hogares.map((hogar) => (
              <article key={hogar.id} className="feature-item">
                <h3>{hogar.nombre}</h3>
                <p>{hogar.descripcion}</p>
                <p>Integrantes: {hogar.integrantesIds.length}</p>
                <p>Solicitudes pendientes: {hogar.solicitudesPendientesIds.length}</p>

                <div className="feature-item-actions">
                  <button className="btn btn-outline-success" onClick={() => void handleSolicitarIngreso(hogar.id)}>
                    Solicitar ingreso
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}