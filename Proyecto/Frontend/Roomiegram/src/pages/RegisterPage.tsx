import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolveApiError } from '../services/api'
import { registerUser } from '../services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    usuario: '',
    contrasena: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await registerUser(form)
      setSuccessMessage('Cuenta creada correctamente. Ahora puedes iniciar sesion.')
      setTimeout(() => {
        navigate('/login')
      }, 700)
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible registrar el usuario'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page shell">
      <section className="auth-panel glass-card">
        <div className="auth-copy">
          <p className="eyebrow">Nuevo roomie</p>
          <h1>Crea tu cuenta y conecta con tu hogar compartido</h1>
          <p>
            Este formulario apunta a `POST /auth/register`. Si tu backend requiere mas campos, solo hay que extender el DTO y el servicio.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              value={form.nombre}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              required
            />
          </label>

          <label>
            Correo
            <input
              type="email"
              value={form.correo}
              onChange={(event) => setForm((current) => ({ ...current, correo: event.target.value }))}
              required
            />
          </label>

          <label>
            Telefono
            <input
              value={form.telefono}
              onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
              required
            />
          </label>

          <label>
            Usuario
            <input
              value={form.usuario}
              onChange={(event) => setForm((current) => ({ ...current, usuario: event.target.value }))}
              required
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={form.contrasena}
              onChange={(event) => setForm((current) => ({ ...current, contrasena: event.target.value }))}
              required
            />
          </label>

          {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}
          {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

          <button className="btn btn-success btn-lg" disabled={submitting} type="submit">
            {submitting ? 'Registrando...' : 'Crear cuenta'}
          </button>

          <p className="auth-link-row">
            Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
          </p>
        </form>
      </section>
    </main>
  )
}