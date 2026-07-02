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
    titulo: "Convivencia más clara",
    nombreVisible: "Camila R.",
    mensaje: "Me ayudó a encontrar roomies con horarios parecidos y reglas claras desde el primer día.",
  },
  {
    id: -2,
    titulo: "Publicación simple",
    nombreVisible: "Diego M.",
    mensaje: "Publiqué una habitación y pude revisar mejor a quienes estaban interesados antes de coordinar.",
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
  const [editingHistoria, setEditingHistoria] = useState<Historia | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      setMessage("Ingresa un título breve para tu historia.");
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
      const payload = {
        titulo,
        mensaje,
        nombreVisible: editingHistoria?.nombreVisible || user?.nombre || user?.usuario || "Usuario Roomiegram",
        usuarioCreador: editingHistoria?.usuarioCreador || user?.usuario,
      };

      if (editingHistoria) {
        const actualizada = await publicacionService.actualizarHistoria(
          editingHistoria.id,
          payload,
          user?.usuario || "",
          user?.role || "CLIENTE",
        );
        setHistorias((current) => current.map((historia) =>
          historia.id === actualizada.id ? actualizada : historia
        ));
        setEditingHistoria(null);
        setMessage("Historia actualizada correctamente.");
      } else {
        const historia = await publicacionService.crearHistoria(payload);
        setHistorias((current) => [historia, ...current]);
        setMessage("Historia publicada correctamente.");
      }

      setForm({ titulo: "", mensaje: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la historia.");
    } finally {
      setIsSaving(false);
    }
  };

  const puedeGestionarHistoria = (historia: Historia) => {
    if (historia.id < 0) return false;
    if (user?.role === "ADMIN") return true;
    return !!user?.usuario && historia.usuarioCreador?.toLowerCase() === user.usuario.toLowerCase();
  };

  const startEdit = (historia: Historia) => {
    setEditingHistoria(historia);
    setForm({
      titulo: historia.titulo,
      mensaje: historia.mensaje,
    });
    setMessage("Editando historia. Guarda los cambios o cancela la edición.");
  };

  const cancelEdit = () => {
    setEditingHistoria(null);
    setForm({ titulo: "", mensaje: "" });
    setMessage("");
  };

  const handleDelete = async (historia: Historia) => {
    if (!user?.usuario) {
      setMessage("No se pudo identificar tu sesión.");
      return;
    }

    const confirmar = window.confirm(`¿Eliminar la historia "${historia.titulo}"?`);
    if (!confirmar) return;

    try {
      setDeletingId(historia.id);
      await publicacionService.eliminarHistoria(historia.id, user.usuario, user.role || "CLIENTE");
      setHistorias((current) => current.filter((item) => item.id !== historia.id));
      if (editingHistoria?.id === historia.id) {
        cancelEdit();
      }
      setMessage("Historia eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la historia.");
    } finally {
      setDeletingId(null);
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
          <p>Lee experiencias reales de convivencia y comparte brevemente cómo Roomiegram te ayudó.</p>
        </div>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="stories-layout">
        <form className="story-form-card" onSubmit={handleSubmit}>
          <h2>{editingHistoria ? "Editar historia" : "Comparte tu historia"}</h2>
          <p>Escribe una reseña breve y clara. Tu nombre visible se tomará desde tu perfil.</p>
          <input
            className="form-control"
            placeholder="Título breve"
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
            {isSaving ? "Guardando..." : editingHistoria ? "Guardar cambios" : "Publicar historia"}
          </button>
          {editingHistoria && (
            <button className="btn btn-outline-success" type="button" onClick={cancelEdit} disabled={isSaving}>
              Cancelar edición
            </button>
          )}
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
                {puedeGestionarHistoria(historia) && (
                  <div className="item-actions story-actions">
                    <button className="btn btn-outline-success btn-sm" type="button" onClick={() => startEdit(historia)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      disabled={deletingId === historia.id}
                      onClick={() => handleDelete(historia)}
                    >
                      {deletingId === historia.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
