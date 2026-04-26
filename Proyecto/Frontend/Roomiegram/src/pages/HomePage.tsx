import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../services/api'
import { fetchPublicaciones } from '../services/publicacionService'
import type { Publicacion } from '../types/domain'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPublicaciones() {
      try {
        const data = await fetchPublicaciones()
        if (!cancelled) {
          setPublicaciones(data)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(resolveApiError(error, 'No fue posible cargar publicaciones'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPublicaciones()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="shell page-stack">
      <header className="topbar glass-card">
        <div>
          <p className="eyebrow">Roomiegram</p>
          <h1 className="brand-title">Tu hogar compartido, conectado con microservicios reales</h1>
        </div>
        <nav className="topbar-links">
          <Link className="btn btn-outline-light" to="/register">
            Crear cuenta
          </Link>
          <Link className="btn btn-success" to={isAuthenticated ? '/dashboard' : '/login'}>
            {isAuthenticated ? 'Ir al panel' : 'Iniciar sesion'}
          </Link>
        </nav>
      </header>

      <section className="hero-grid glass-card hero-card">
        <div className="hero-copy">
          <span className="pill-tag">Frontend conectado a usuario, hogar, publicacion, tarea y hogarcuenta</span>
          <h2>Administra publicaciones, hogares, tareas y cuentas desde un solo flujo.</h2>
          <p>
            Este frontend usa la estructura de navegacion y contexto inspirada en Workean2, pero adaptada al dominio de Roomiegram.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-success btn-lg" to={isAuthenticated ? '/dashboard' : '/login'}>
              Entrar al dashboard
            </Link>
            <Link className="btn btn-outline-dark btn-lg" to="/register">
              Registrar roomie
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src={heroImage} alt="Vista principal de Roomiegram" />
        </div>
      </section>

      <section className="stats-grid">
        <article className="glass-card stat-card">
          <span className="stat-label">Auth</span>
          <strong>/auth/login y /auth/register</strong>
        </article>
        <article className="glass-card stat-card">
          <span className="stat-label">Hogares</span>
          <strong>/hogares</strong>
        </article>
        <article className="glass-card stat-card">
          <span className="stat-label">Feed</span>
          <strong>/publicaciones/listar</strong>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Publicaciones</p>
          <h3>Ofertas activas del backend</h3>
        </div>
        {loading ? <span className="status-chip">Cargando...</span> : <span className="status-chip">{publicaciones.length} resultados</span>}
      </section>

      {errorMessage ? <div className="alert alert-warning">{errorMessage}</div> : null}

      <section className="listing-grid">
        {publicaciones.map((publicacion) => (
          <article key={publicacion.id ?? publicacion.titulo} className="listing-card glass-card">
            <div className="listing-meta">
              <span>{publicacion.ubicacion}</span>
              <span>{publicacion.usuarioCreador}</span>
            </div>
            <h4>{publicacion.titulo}</h4>
            <p>{publicacion.descripcion}</p>
            <div className="listing-tags">
              <span>{publicacion.numeroHabitaciones} hab.</span>
              <span>{publicacion.numeroPersonas} personas</span>
              <span>{publicacion.numeroBanos} banos</span>
            </div>
            <strong className="listing-price">${publicacion.precio.toLocaleString('es-CL')}</strong>
          </article>
        ))}

        {!loading && publicaciones.length === 0 ? (
          <article className="glass-card empty-card">
            <h4>No hay publicaciones disponibles</h4>
            <p>Cuando el microservicio de publicaciones entregue datos, apareceran aqui automaticamente.</p>
          </article>
        ) : null}
      </section>
    </main>
  )
}