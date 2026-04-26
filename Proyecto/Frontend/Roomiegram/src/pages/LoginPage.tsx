import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../services/api'
import { loginUser } from '../services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const session = await loginUser({ usuario, contrasena })
      login(session)
      const target = typeof location.state?.from === 'string' ? location.state.from : '/dashboard'
      navigate(target, { replace: true })
    } catch (error) {
      setErrorMessage(resolveApiError(error, 'No fue posible iniciar sesion'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page shell">
      <section className="auth-panel glass-card">
        <div className="auth-copy">
          <p className="eyebrow">Acceso Roomiegram</p>
          <h1>Ingresa para administrar hogares y publicaciones</h1>
          <p>
            El login ya consume el microservicio `usuario` y guarda la sesion local para navegar el dashboard protegido.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Usuario
            <input value={usuario} onChange={(event) => setUsuario(event.target.value)} required />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              required
            />
          </label>

          {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

          <button className="btn btn-success btn-lg" disabled={submitting} type="submit">
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="auth-link-row">
            No tienes cuenta? <Link to="/register">Registrate aqui</Link>
          </p>
        </form>
      </section>
    </main>
  )
}