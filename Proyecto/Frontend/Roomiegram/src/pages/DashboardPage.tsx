import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../services/api'
import { createHogarCuenta, fetchHogarCuentas } from '../services/hogarCuentaService'
import { associateCuenta, associatePublicacion, associateTarea, createHogar, fetchHogares } from '../services/hogarService'
import { createPublicacion, fetchPublicaciones } from '../services/publicacionService'
import { createTarea, fetchTareas } from '../services/tareaService'
import type { Hogar, HogarCuenta, Publicacion, Tarea } from '../types/domain'

const initialHogarForm = {
  nombre: '',
  descripcion: '',
}

const initialPublicacionForm = {
  titulo: '',
  ubicacion: '',
  descripcion: '',
  precio: '250000',
  numeroHabitaciones: '1',
  numeroPersonas: '1',
  numeroBanos: '1',
}

const initialTareaForm = {
  titulo: '',
  descripcion: '',
  fecha: '',
}

const initialCuentaForm = {
  descripcion: '',
  monto: '0',
  deudores: '',
}

export default function DashboardPage() {
  const { logout, user } = useAuth()
  const [hogares, setHogares] = useState<Hogar[]>([])
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [cuentas, setCuentas] = useState<HogarCuenta[]>([])
  const [selectedHogarId, setSelectedHogarId] = useState<number | ''>('')
  const [hogarForm, setHogarForm] = useState(initialHogarForm)
  const [publicacionForm, setPublicacionForm] = useState(initialPublicacionForm)
  const [tareaForm, setTareaForm] = useState(initialTareaForm)
  const [cuentaForm, setCuentaForm] = useState(initialCuentaForm)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const [hogaresData, publicacionesData, tareasData, cuentasData] = await Promise.all([
        fetchHogares(),
        fetchPublicaciones(),
        fetchTareas(),
        fetchHogarCuentas(),
      ])

      setHogares(hogaresData)
      setPublicaciones(publicacionesData)
      setTareas(tareasData)
      setCuentas(cuentasData)
      if (hogaresData.length > 0) {
        setSelectedHogarId((current) => current || hogaresData[0].id || '')
      }
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible cargar el dashboard'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateHogar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    try {
      const hogar = await createHogar({
        nombre: hogarForm.nombre,
        descripcion: hogarForm.descripcion,
        usuarioCreadorId: user.id,
      })

      setStatusMessage(`Hogar ${hogar.nombre} creado correctamente`)
      setHogarForm(initialHogarForm)
      await loadData()
      if (hogar.id) {
        setSelectedHogarId(hogar.id)
      }
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible crear el hogar'))
    }
  }

  async function handleCreatePublicacion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    try {
      const publicacion = await createPublicacion({
        usuarioCreador: user.usuario,
        titulo: publicacionForm.titulo,
        ubicacion: publicacionForm.ubicacion,
        descripcion: publicacionForm.descripcion,
        precio: Number(publicacionForm.precio),
        numeroHabitaciones: Number(publicacionForm.numeroHabitaciones),
        numeroPersonas: Number(publicacionForm.numeroPersonas),
        numeroBanos: Number(publicacionForm.numeroBanos),
      })

      if (selectedHogarId && publicacion.id) {
        await associatePublicacion(selectedHogarId, {
          administradorId: user.id,
          recursoId: publicacion.id,
        })
      }

      setStatusMessage(`Publicacion ${publicacion.titulo} creada${selectedHogarId ? ' y asociada al hogar' : ''}`)
      setPublicacionForm(initialPublicacionForm)
      await loadData()
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible crear la publicacion'))
    }
  }

  async function handleCreateTarea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    try {
      const tarea = await createTarea({
        titulo: tareaForm.titulo,
        encargado: user.usuario,
        descripcion: tareaForm.descripcion,
        fecha: tareaForm.fecha,
      })

      if (selectedHogarId && tarea.id) {
        await associateTarea(selectedHogarId, {
          administradorId: user.id,
          recursoId: tarea.id,
        })
      }

      setStatusMessage(`Tarea ${tarea.titulo} creada${selectedHogarId ? ' y asociada al hogar' : ''}`)
      setTareaForm(initialTareaForm)
      await loadData()
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible crear la tarea'))
    }
  }

  async function handleCreateCuenta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    try {
      const deudores = cuentaForm.deudores
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((usuarioId) => ({ usuarioId }))

      const cuenta = await createHogarCuenta({
        descripcion: cuentaForm.descripcion,
        monto: Number(cuentaForm.monto),
        deudores,
      })

      if (selectedHogarId && cuenta.id) {
        await associateCuenta(selectedHogarId, {
          administradorId: user.id,
          recursoId: cuenta.id,
        })
      }

      setStatusMessage(`Cuenta ${cuenta.descripcion} creada${selectedHogarId ? ' y asociada al hogar' : ''}`)
      setCuentaForm(initialCuentaForm)
      await loadData()
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible crear la cuenta del hogar'))
    }
  }

  return (
    <main className="shell page-stack dashboard-page">
      <header className="topbar glass-card">
        <div>
          <p className="eyebrow">Dashboard conectado</p>
          <h1 className="brand-title">Hola, {user?.usuario}</h1>
          <p className="muted-copy">Desde aqui consumes varios microservicios Spring de Roomiegram.</p>
        </div>
        <div className="topbar-links">
          <Link className="btn btn-outline-light" to="/">
            Volver al inicio
          </Link>
          <button className="btn btn-danger" onClick={logout} type="button">
            Cerrar sesion
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="glass-card stat-card">
          <span className="stat-label">Hogares</span>
          <strong>{hogares.length}</strong>
        </article>
        <article className="glass-card stat-card">
          <span className="stat-label">Publicaciones</span>
          <strong>{publicaciones.length}</strong>
        </article>
        <article className="glass-card stat-card">
          <span className="stat-label">Tareas</span>
          <strong>{tareas.length}</strong>
        </article>
        <article className="glass-card stat-card">
          <span className="stat-label">Cuentas</span>
          <strong>{cuentas.length}</strong>
        </article>
      </section>

      {loading ? <div className="alert alert-info">Cargando datos desde los microservicios...</div> : null}
      {statusMessage ? <div className="alert alert-success">{statusMessage}</div> : null}
      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      <section className="control-strip glass-card">
        <div>
          <p className="eyebrow">Hogar activo</p>
          <select
            className="form-select"
            value={selectedHogarId}
            onChange={(event) => setSelectedHogarId(event.target.value ? Number(event.target.value) : '')}
          >
            <option value="">Sin asociacion automatica</option>
            {hogares.map((hogar) => (
              <option key={hogar.id} value={hogar.id}>
                {hogar.nombre}
              </option>
            ))}
          </select>
        </div>
        <p className="muted-copy">
          Si eliges un hogar, las nuevas publicaciones, tareas y cuentas tambien se asociaran al agregado `hogar`.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="glass-card form-card">
          <h3>Crear hogar</h3>
          <form className="dashboard-form" onSubmit={handleCreateHogar}>
            <input
              placeholder="Nombre del hogar"
              value={hogarForm.nombre}
              onChange={(event) => setHogarForm((current) => ({ ...current, nombre: event.target.value }))}
              required
            />
            <textarea
              placeholder="Descripcion"
              value={hogarForm.descripcion}
              onChange={(event) => setHogarForm((current) => ({ ...current, descripcion: event.target.value }))}
              rows={3}
            />
            <button className="btn btn-success" type="submit">
              Guardar hogar
            </button>
          </form>
        </article>

        <article className="glass-card form-card">
          <h3>Crear publicacion</h3>
          <form className="dashboard-form" onSubmit={handleCreatePublicacion}>
            <input
              placeholder="Titulo"
              value={publicacionForm.titulo}
              onChange={(event) => setPublicacionForm((current) => ({ ...current, titulo: event.target.value }))}
              required
            />
            <input
              placeholder="Ubicacion"
              value={publicacionForm.ubicacion}
              onChange={(event) => setPublicacionForm((current) => ({ ...current, ubicacion: event.target.value }))}
              required
            />
            <textarea
              placeholder="Descripcion"
              value={publicacionForm.descripcion}
              onChange={(event) => setPublicacionForm((current) => ({ ...current, descripcion: event.target.value }))}
              rows={3}
              required
            />
            <div className="inline-fields">
              <input
                min="1"
                placeholder="Precio"
                type="number"
                value={publicacionForm.precio}
                onChange={(event) => setPublicacionForm((current) => ({ ...current, precio: event.target.value }))}
                required
              />
              <input
                min="1"
                placeholder="Habitaciones"
                type="number"
                value={publicacionForm.numeroHabitaciones}
                onChange={(event) => setPublicacionForm((current) => ({ ...current, numeroHabitaciones: event.target.value }))}
                required
              />
            </div>
            <div className="inline-fields">
              <input
                min="1"
                placeholder="Personas"
                type="number"
                value={publicacionForm.numeroPersonas}
                onChange={(event) => setPublicacionForm((current) => ({ ...current, numeroPersonas: event.target.value }))}
                required
              />
              <input
                min="1"
                placeholder="Banos"
                type="number"
                value={publicacionForm.numeroBanos}
                onChange={(event) => setPublicacionForm((current) => ({ ...current, numeroBanos: event.target.value }))}
                required
              />
            </div>
            <button className="btn btn-success" type="submit">
              Publicar oferta
            </button>
          </form>
        </article>

        <article className="glass-card form-card">
          <h3>Crear tarea</h3>
          <form className="dashboard-form" onSubmit={handleCreateTarea}>
            <input
              placeholder="Titulo"
              value={tareaForm.titulo}
              onChange={(event) => setTareaForm((current) => ({ ...current, titulo: event.target.value }))}
              required
            />
            <textarea
              placeholder="Descripcion"
              value={tareaForm.descripcion}
              onChange={(event) => setTareaForm((current) => ({ ...current, descripcion: event.target.value }))}
              rows={3}
              required
            />
            <input
              type="date"
              value={tareaForm.fecha}
              onChange={(event) => setTareaForm((current) => ({ ...current, fecha: event.target.value }))}
              required
            />
            <button className="btn btn-success" type="submit">
              Guardar tarea
            </button>
          </form>
        </article>

        <article className="glass-card form-card">
          <h3>Crear cuenta del hogar</h3>
          <form className="dashboard-form" onSubmit={handleCreateCuenta}>
            <input
              placeholder="Descripcion"
              value={cuentaForm.descripcion}
              onChange={(event) => setCuentaForm((current) => ({ ...current, descripcion: event.target.value }))}
              required
            />
            <input
              min="1"
              placeholder="Monto total"
              type="number"
              value={cuentaForm.monto}
              onChange={(event) => setCuentaForm((current) => ({ ...current, monto: event.target.value }))}
              required
            />
            <input
              placeholder="IDs de deudores separados por coma"
              value={cuentaForm.deudores}
              onChange={(event) => setCuentaForm((current) => ({ ...current, deudores: event.target.value }))}
            />
            <button className="btn btn-success" type="submit">
              Guardar cuenta
            </button>
          </form>
        </article>
      </section>

      <section className="resource-grid">
        <article className="glass-card resource-card">
          <h3>Hogares</h3>
          <ul className="resource-list">
            {hogares.map((hogar) => (
              <li key={hogar.id}>
                <strong>{hogar.nombre}</strong>
                <span>{hogar.integrantesIds.length} integrantes</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-card resource-card">
          <h3>Tareas</h3>
          <ul className="resource-list">
            {tareas.map((tarea) => (
              <li key={tarea.id}>
                <strong>{tarea.titulo}</strong>
                <span>{tarea.encargado}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-card resource-card">
          <h3>Cuentas</h3>
          <ul className="resource-list">
            {cuentas.map((cuenta) => (
              <li key={cuenta.id}>
                <strong>{cuenta.descripcion}</strong>
                <span>${Number(cuenta.monto).toLocaleString('es-CL')}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-card resource-card">
          <h3>Publicaciones</h3>
          <ul className="resource-list">
            {publicaciones.map((publicacion) => (
              <li key={publicacion.id}>
                <strong>{publicacion.titulo}</strong>
                <span>{publicacion.ubicacion}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}