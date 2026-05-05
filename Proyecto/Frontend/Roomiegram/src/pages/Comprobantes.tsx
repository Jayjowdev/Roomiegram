import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Logo-removebg-preview.png"
import { useAuth } from "../context/AuthContext"
import { crearComprobante } from "../services/comprobanteService"

type ComprobanteFormInput = {
  hogarCuentaId: number | string
  montoPagado: number | string
  observacion: string
  archivo: File | undefined
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result.split(",")[1] ?? "" : ""
      resolve(result)
    }
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
    reader.readAsDataURL(file)
  })
}

export default function Comprobantes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitError, setSubmitError] = useState("")
  const [submitMessage, setSubmitMessage] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComprobanteFormInput>({
    defaultValues: {
      hogarCuentaId: "",
      montoPagado: "",
      observacion: "",
      archivo: undefined,
    },
  })
  const archivoField = register("archivo", {
    validate: (value) => value instanceof File || "Selecciona un archivo",
  })

  async function onSubmit(values: ComprobanteFormInput) {
    if (!user) {
      setSubmitError("Debes iniciar sesión para subir comprobantes")
      return
    }

    setSubmitError("")
    setSubmitMessage("")

    try {
      if (!values.archivo) {
        setSubmitError("Selecciona un archivo antes de enviar")
        return
      }

      const archivo = await fileToBase64(values.archivo)

      await crearComprobante({
        hogarCuentaId: Number(values.hogarCuentaId),
        usuarioId: user.id,
        nombreArchivo: values.archivo.name,
        tipoContenido: values.archivo.type || "application/octet-stream",
        tamanoArchivo: values.archivo.size,
        montoPagado: Number(values.montoPagado),
        observacion: values.observacion,
        archivo,
      })

      setSubmitMessage("Comprobante enviado correctamente.")
      reset()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo subir el comprobante")
    }
  }

  return (
    <div className="feature-page">
      <header className="feature-header">
        <img src={logo} alt="RoomieGram" className="home-logo" onClick={() => navigate("/dashboard")} />

        <div className="feature-header-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/gastos")}>Gastos</button>
          <button className="btn btn-success" onClick={() => navigate("/notificaciones")}>Notificaciones</button>
        </div>
      </header>

      <section className="feature-panel">
        <div className="feature-panel-header">
          <div>
            <h2>Subir comprobante</h2>
            <p>El formulario valida archivo, monto y cuenta antes de enviar el payload al microservicio.</p>
          </div>
        </div>

        <form className="feature-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="feature-grid">
            <div>
              <label className="feature-label">ID de hogar cuenta</label>
              <input
                className="form-control"
                type="number"
                min="1"
                {...register("hogarCuentaId", {
                  required: "Ingresa un ID de cuenta válido",
                  validate: (value) => Number(value) > 0 || "Ingresa un ID de cuenta válido",
                })}
              />
              {errors.hogarCuentaId ? <p className="form-error">{errors.hogarCuentaId.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Monto pagado</label>
              <input
                className="form-control"
                type="number"
                min="1"
                step="0.01"
                {...register("montoPagado", {
                  required: "El monto debe ser mayor a 0",
                  validate: (value) => Number(value) > 0 || "El monto debe ser mayor a 0",
                })}
              />
              {errors.montoPagado ? <p className="form-error">{errors.montoPagado.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Archivo</label>
              <input
                className="form-control"
                type="file"
                name={archivoField.name}
                ref={archivoField.ref}
                onBlur={archivoField.onBlur}
                onChange={(event) => setValue("archivo", event.target.files?.[0], { shouldValidate: true, shouldDirty: true })}
              />
              {errors.archivo ? <p className="form-error">{errors.archivo.message}</p> : null}
            </div>

            <div>
              <label className="feature-label">Observación</label>
              <textarea
                className="form-control feature-textarea"
                rows={3}
                {...register("observacion", {
                  required: "Agrega una observación",
                  minLength: {
                    value: 5,
                    message: "Agrega una observación",
                  },
                })}
              />
              {errors.observacion ? <p className="form-error">{errors.observacion.message}</p> : null}
            </div>
          </div>

          {submitError ? <p className="form-error">{submitError}</p> : null}
          {submitMessage ? <p className="form-success">{submitMessage}</p> : null}

          <div className="feature-actions">
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? "Subiendo..." : "Subir comprobante"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}