import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { crearHogarCuenta, eliminarHogarCuenta, listarHogarCuentas } from "../services/hogarCuentaService"
import type { HogarCuenta } from "../types/HogarCuenta"

const gastoSchema = z.object({
  descripcion: z.string().trim().min(3, "Ingresa una descripción"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
})

type GastoFormInput = z.input<typeof gastoSchema>
type GastoFormValues = z.output<typeof gastoSchema>

export default function Gastos() {
  const navigate = useNavigate()
  const [gastos, setGastos] = useState<HogarCuenta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [actionError, setActionError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormInput, unknown, GastoFormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      descripcion: "",
      monto: 0,
    },
  })

  async function loadGastos() {
    setFetchError("")

    try {
      const response = await listarHogarCuentas()
      setGastos(response)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar los gastos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadGastos()
  }, [])

  async function onSubmit(values: GastoFormValues) {
    setSubmitError("")

    try {
      await crearHogarCuenta(values)
      reset()
      await loadGastos()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el gasto")
    }
  }

  async function handleEliminar(id: number) {
    setActionError("")

    try {
      await eliminarHogarCuenta(id)
      await loadGastos()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar el gasto")
    }
  }

  return (
    <div className="feature-page">
      <header className="feature-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/dashboard")} />

        <div className="feature-header-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/tareas")}>Tareas</button>
          <button className="btn btn-success" onClick={() => navigate("/comprobantes")}>Comprobantes</button>
        </div>
      </header>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Registrar gasto</h2>
            <p>Formulario conectado al microservicio `hogar-cuentas` con validación previa.</p>
          </div>
        </div>

        <form className="feature-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="feature-grid">
            <div>
              <label className="feature-label">Descripción</label>
              <input className="form-control" {...register("descripcion")} />
              {errors.descripcion ? <p className="form-error">{errors.descripcion.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Monto</label>
              <input className="form-control" type="number" min="1" step="0.01" {...register("monto")} />
              {errors.monto ? <p className="form-error">{errors.monto.message}</p> : null}
            </div>
          </div>

          {submitError ? <p className="form-error">{submitError}</p> : null}

          <div className="feature-actions">
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar gasto"}
            </button>
          </div>
        </form>
      </section>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Gastos registrados</h2>
            <p>Lista obtenida desde `GET /hogar-cuentas`.</p>
          </div>
        </div>

        {actionError ? <p className="form-error">{actionError}</p> : null}
        {isLoading ? <div className="feature-empty">Cargando gastos...</div> : null}
        {!isLoading && fetchError ? <div className="feature-empty">{fetchError}</div> : null}
        {!isLoading && !fetchError && gastos.length === 0 ? <div className="feature-empty">No hay gastos registrados.</div> : null}

        {!isLoading && !fetchError && gastos.length > 0 ? (
          <div className="feature-list">
            {gastos.map((gasto) => (
              <article key={gasto.id} className="feature-item">
                <h3>{gasto.descripcion}</h3>
                <p><strong>Monto:</strong> ${gasto.monto}</p>
                <p><strong>Deudores:</strong> {gasto.deudores.length}</p>

                <div className="feature-item-actions">
                  <button className="btn btn-outline-danger" onClick={() => void handleEliminar(gasto.id)}>
                    Eliminar
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