import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { useAuth } from "../context/AuthContext"
import { guardarPublicacion, listarPublicaciones } from "../services/publicacionService"
import type { Publicacion } from "../types/Publicacion"

const publicacionSchema = z.object({
  titulo: z.string().trim().min(4, "Ingresa un título más descriptivo"),
  ubicacion: z.string().trim().min(3, "Ingresa una ubicación"),
  descripcion: z.string().trim().min(10, "La descripción debe tener al menos 10 caracteres"),
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
  numeroHabitaciones: z.coerce.number().int().positive("Ingresa el número de habitaciones"),
  numeroPersonas: z.coerce.number().int().positive("Ingresa el número de personas"),
  numeroBanos: z.coerce.number().int().positive("Ingresa el número de baños"),
})

type PublicacionFormInput = z.input<typeof publicacionSchema>
type PublicacionFormValues = z.output<typeof publicacionSchema>

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PublicacionFormInput, unknown, PublicacionFormValues>({
    resolver: zodResolver(publicacionSchema),
    defaultValues: {
      titulo: "",
      ubicacion: "",
      descripcion: "",
      precio: 0,
      numeroHabitaciones: 1,
      numeroPersonas: 1,
      numeroBanos: 1,
    },
  })

  async function loadPublicaciones() {
    setFetchError("")

    try {
      const response = await listarPublicaciones()
      setPublicaciones(response)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar las publicaciones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPublicaciones()
  }, [])

  async function onSubmit(values: PublicacionFormValues) {
    if (!user) {
      setSubmitError("Debes iniciar sesión para publicar")
      return
    }

    setSubmitError("")

    try {
      await guardarPublicacion({
        ...values,
        usuarioCreador: user.usuario,
      })
      reset({
        titulo: "",
        ubicacion: "",
        descripcion: "",
        precio: 0,
        numeroHabitaciones: 1,
        numeroPersonas: 1,
        numeroBanos: 1,
      })
      await loadPublicaciones()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar la publicación")
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <img
          src={logo}
          alt="RoomieGram"
          className="home-logo"
          onClick={() => navigate("/")}
        />

        <div className="home-header-actions">
          <button
            className="btn btn-outline-success me-2"
            onClick={() => navigate("/hogares")}
          >
            Hogares
          </button>

          <button
            className="btn btn-success"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-text">
          <h1>Encuentra tu roomie ideal</h1>
          <p>
            Explora publicaciones reales, crea tu aviso y conecta el frontend
            con el microservicio de publicaciones.
          </p>
        </div>
      </section>

      <section className="feature-panel home-form-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Nueva publicación</h2>
            <p>Los campos se validan antes de llamar al microservicio en el puerto 8086.</p>
          </div>
        </div>

        <form className="feature-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="feature-grid">
            <div>
              <label className="feature-label">Título</label>
              <input className="form-control" {...register("titulo")} />
              {errors.titulo ? <p className="form-error">{errors.titulo.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Ubicación</label>
              <input className="form-control" {...register("ubicacion")} />
              {errors.ubicacion ? <p className="form-error">{errors.ubicacion.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Precio</label>
              <input className="form-control" type="number" min="1" {...register("precio")} />
              {errors.precio ? <p className="form-error">{errors.precio.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Habitaciones</label>
              <input className="form-control" type="number" min="1" {...register("numeroHabitaciones")} />
              {errors.numeroHabitaciones ? <p className="form-error">{errors.numeroHabitaciones.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Personas</label>
              <input className="form-control" type="number" min="1" {...register("numeroPersonas")} />
              {errors.numeroPersonas ? <p className="form-error">{errors.numeroPersonas.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Baños</label>
              <input className="form-control" type="number" min="1" {...register("numeroBanos")} />
              {errors.numeroBanos ? <p className="form-error">{errors.numeroBanos.message}</p> : null}
            </div>
          </div>

          <div>
            <label className="feature-label">Descripción</label>
            <textarea className="form-control feature-textarea" rows={4} {...register("descripcion")} />
            {errors.descripcion ? <p className="form-error">{errors.descripcion.message}</p> : null}
          </div>

          {submitError ? <p className="form-error">{submitError}</p> : null}

          <div className="feature-actions">
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? "Publicando..." : "Guardar publicación"}
            </button>
          </div>
        </form>
      </section>

      <section className="home-publicaciones">
        {isLoading ? <div className="feature-empty">Cargando publicaciones...</div> : null}
        {!isLoading && fetchError ? <div className="feature-empty">{fetchError}</div> : null}
        {!isLoading && !fetchError && publicaciones.length === 0 ? (
          <div className="feature-empty">No hay publicaciones registradas todavía.</div>
        ) : null}
        {!isLoading && !fetchError
          ? publicaciones.map((pub) => (
              <article className="home-card" key={pub.id}>
                <div className="home-card-cover">
                  <span>{pub.usuarioCreador}</span>
                </div>

                <div className="home-card-body">
                  <div className="home-card-top">
                    <h3>{pub.titulo}</h3>
                    <p className="home-ubicacion">📍 {pub.ubicacion}</p>
                  </div>

                  <p className="home-desc">{pub.descripcion}</p>

                  <div className="home-tags">
                    <span className="home-tag">${pub.precio}</span>
                    <span className="home-tag">{pub.numeroHabitaciones} habitaciones</span>
                    <span className="home-tag">{pub.numeroPersonas} personas</span>
                    <span className="home-tag">{pub.numeroBanos} baños</span>
                  </div>

                  <button
                    className="btn btn-success w-100 mt-4"
                    onClick={() => navigate(`/perfil/${pub.id}`, { state: { publicacion: pub } })}
                  >
                    Ver perfil
                  </button>
                </div>
              </article>
            ))
          : null}
      </section>
    </div>
  )
}