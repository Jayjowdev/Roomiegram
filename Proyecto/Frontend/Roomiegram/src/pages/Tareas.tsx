import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { guardarTarea, listarTareas } from "../services/tareaService"
import type { Tarea } from "../types/Tarea"

const tareaSchema = z.object({
  titulo: z.string().trim().min(3, "Ingresa un título"),
  encargado: z.string().trim().min(3, "Ingresa un responsable"),
  descripcion: z.string().trim().min(10, "Agrega una descripción más clara"),
  fecha: z.string().min(1, "Selecciona una fecha"),
})

type TareaFormInput = z.input<typeof tareaSchema>
type TareaFormValues = z.output<typeof tareaSchema>

export default function Tareas() {
  const navigate = useNavigate()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TareaFormInput, unknown, TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: "",
      encargado: "",
      descripcion: "",
      fecha: "",
    },
  })

  async function loadTareas() {
    setFetchError("")

    try {
      const response = await listarTareas()
      setTareas(response)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar las tareas")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTareas()
  }, [])

  async function onSubmit(values: TareaFormValues) {
    setSubmitError("")

    try {
      await guardarTarea(values)
      reset()
      await loadTareas()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar la tarea")
    }
  }

  return (
    <div className="feature-page">
      <header className="feature-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/dashboard")} />

        <div className="feature-header-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="btn btn-success" onClick={() => navigate("/gastos")}>Gastos</button>
        </div>
      </header>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Nueva tarea</h2>
            <p>Formulario conectado al microservicio de tareas con validación zod.</p>
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
              <label className="feature-label">Encargado</label>
              <input className="form-control" {...register("encargado")} />
              {errors.encargado ? <p className="form-error">{errors.encargado.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Fecha</label>
              <input className="form-control" type="date" {...register("fecha")} />
              {errors.fecha ? <p className="form-error">{errors.fecha.message}</p> : null}
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
              {isSubmitting ? "Guardando..." : "Crear tarea"}
            </button>
          </div>
        </form>
      </section>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Tareas registradas</h2>
            <p>Datos obtenidos desde `GET /tareas/listar`.</p>
          </div>
        </div>

        {isLoading ? <div className="feature-empty">Cargando tareas...</div> : null}
        {!isLoading && fetchError ? <div className="feature-empty">{fetchError}</div> : null}
        {!isLoading && !fetchError && tareas.length === 0 ? <div className="feature-empty">No hay tareas registradas.</div> : null}

        {!isLoading && !fetchError && tareas.length > 0 ? (
          <div className="feature-list">
            {tareas.map((tarea) => (
              <article key={tarea.id} className="feature-item">
                <h3>{tarea.titulo}</h3>
                <p><strong>Encargado:</strong> {tarea.encargado}</p>
                <p><strong>Fecha:</strong> {tarea.fecha}</p>
                <p>{tarea.descripcion}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}