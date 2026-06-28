import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import { LogoutButton } from "../components/LogoutButton";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { publicacionService, type Historia } from "../services/publicacionService";

const historiasFallback = [
  {
    id: -1,
    titulo: "Convivencia mas clara",
    nombreVisible: "Camila R.",
    mensaje: "Me ayudo a encontrar roomies con horarios parecidos y reglas claras desde el primer dia.",
  },
  {
    id: -2,
    titulo: "Publicacion simple",
    nombreVisible: "Diego M.",
    mensaje: "Publique una habitacion y pude revisar mejor a quienes estaban interesados antes de coordinar.",
  },
] satisfies Historia[];

export default function Historias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    titulo: "",
    mensaje: "",
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    publicacionService
      .listarHistorias()
      .then((data) => {
        if (isMounted) setHistorias(data);
      })
      .catch(() => {
        if (isMounted) {
          setHistorias([]);
          setMessage("No se pudieron cargar las historias guardadas.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const titulo = form.titulo.trim();
    const mensaje = form.mensaje.trim();

    if (!titulo) {
      setMessage("Ingresa un titulo breve para tu historia.");
      return;
    }
    if (!mensaje) {
      setMessage("Escribe tu historia antes de publicarla.");
      return;
    }
    if (mensaje.length < 20) {
      setMessage("La historia debe tener al menos 20 caracteres.");
      return;
    }
    if (mensaje.length > 500) {
      setMessage("La historia no puede superar 500 caracteres.");
      return;
    }

    try {
      setIsSaving(true);
      const historia = await publicacionService.crearHistoria({
        titulo,
        mensaje,
        nombreVisible: user?.nombre || user?.usuario || "Usuario Roomiegram",
        usuarioCreador: user?.usuario,
      });
      setHistorias((current) => [historia, ...current]);
      setForm({ titulo: "", mensaje: "" });
      setMessage("Historia publicada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo publicar la historia.");
    } finally {
      setIsSaving(false);
    }
  };

  const historiasVisibles = historias.length > 0 ? historias : historiasFallback;

  return (
    <div className="perfil-page stories-page">
      <header className="perfil-header">
        <div className="perfil-header-left">
          <img src={logo} alt="RoomieGram" className="perfil-logo" onClick={() => navigate("/home")} />
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>

      <section className="stories-hero">
        <div>
          <span className="demo-kicker">Historias</span>
          <h1>Historias de usuarios</h1>
          <p>Lee experiencias reales de convivencia y comparte brevemente como Roomiegram te ayudo.</p>
        </div>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="stories-layout">
        <form className="story-form-card" onSubmit={handleSubmit}>
          <h2>Comparte tu historia</h2>
          <p>Escribe una reseña breve y clara. Tu nombre visible se tomara desde tu perfil.</p>
          <input
            className="form-control"
            placeholder="Titulo breve"
            maxLength={80}
            value={form.titulo}
            onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
          />
          <textarea
            className="form-control"
            placeholder="Cuenta tu experiencia"
            maxLength={500}
            rows={6}
            value={form.mensaje}
            onChange={(event) => setForm((current) => ({ ...current, mensaje: event.target.value }))}
          />
          <small>{form.mensaje.length}/500 caracteres</small>
          <button className="btn btn-success" type="submit" disabled={isSaving}>
            {isSaving ? "Publicando..." : "Publicar historia"}
          </button>
        </form>

        <div className="stories-list">
          {isLoading ? (
            <div className="sin-resultados"><p>Cargando historias...</p></div>
          ) : (
            historiasVisibles.map((historia) => (
              <article className="home-testimonial-card story-card" key={historia.id}>
                <h3>{historia.titulo}</h3>
                <p>"{historia.mensaje}"</p>
                <strong>{historia.nombreVisible}</strong>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
