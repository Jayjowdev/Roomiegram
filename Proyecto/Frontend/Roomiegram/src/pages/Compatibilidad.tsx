import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import avatar4 from "../assets/avatar4.svg";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { usuarioService } from "../services/usuarioService";
import type { PreferenciasCompatibilidad } from "../types/auth";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import { saveLocalPublicacion } from "../utils/localPublicaciones";
import { preferenciasIniciales, preferenciasLabels } from "../utils/preferenciasCompatibilidad";

type MatchCandidate = {
  id: number
  nombre: string
  usuario: string
  correo?: string
  telefono?: string
  descripcion?: string
  imagen?: string
  preferencias: PreferenciasCompatibilidad
  intereses: string[]
  score: number
}

function scoreMatch(preferencias: PreferenciasCompatibilidad, candidato: PreferenciasCompatibilidad) {
  const campos: Array<keyof Omit<PreferenciasCompatibilidad, "presupuesto">> = ["limpieza", "ambiente", "horario", "mascotas", "fumar"];
  const coincidencias = campos.filter((campo) => {
    const valorUsuario = preferencias[campo] || "";
    const valorCandidato = candidato[campo] || "";
    return valorUsuario === valorCandidato || valorUsuario.startsWith("indiferente") || valorCandidato.startsWith("indiferente");
  }).length;

  const presupuestoUsuario = Number(preferencias.presupuesto || 0);
  const presupuestoCandidato = Number(candidato.presupuesto || 0);
  const presupuestoOk = !presupuestoUsuario || !presupuestoCandidato || Math.abs(presupuestoUsuario - presupuestoCandidato) <= 100000;

  return Math.round(((coincidencias + (presupuestoOk ? 1 : 0)) / 6) * 100);
}

function tienePreferenciasCompletas(preferencias?: Partial<PreferenciasCompatibilidad>) {
  return !!preferencias
    && !!preferencias.limpieza
    && !!preferencias.ambiente
    && !!preferencias.horario
    && !!preferencias.mascotas
    && !!preferencias.fumar
    && Number(preferencias.presupuesto || 0) > 0;
}

function preferenciasTags(preferencias: PreferenciasCompatibilidad) {
  return [
    preferenciasLabels.limpieza[preferencias.limpieza as keyof typeof preferenciasLabels.limpieza],
    preferenciasLabels.ambiente[preferencias.ambiente as keyof typeof preferenciasLabels.ambiente],
    preferenciasLabels.horario[preferencias.horario as keyof typeof preferenciasLabels.horario],
  ].filter(Boolean);
}

export default function Compatibilidad() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [compatibilidad, setCompatibilidad] = useState<PreferenciasCompatibilidad>(user?.preferenciasCompatibilidad || preferenciasIniciales);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    usuarioService
      .listar()
      .then(setUsuarios)
      .catch(() => setMessage("No se pudieron cargar usuarios para buscar matches."));
  }, []);

  const candidatos = useMemo<MatchCandidate[]>(() => {
    return usuarios
      .filter((usuario) => usuario.id !== user?.id && tienePreferenciasCompletas(usuario.preferenciasCompatibilidad))
      .map((usuario) => {
        const preferencias = usuario.preferenciasCompatibilidad as PreferenciasCompatibilidad;

        return {
          id: usuario.id,
          nombre: usuario.nombre || usuario.usuario,
          usuario: usuario.usuario,
          correo: usuario.correo,
          telefono: usuario.telefono,
          descripcion: usuario.descripcion || "Usuario registrado con preferencias de convivencia.",
          imagen: usuario.fotoPerfil || avatar4,
          preferencias,
          intereses: usuario.intereses || [],
          score: scoreMatch(compatibilidad, preferencias),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [compatibilidad, user?.id, usuarios]);

  const verPerfil = (candidato: MatchCandidate) => {
    const perfil: Publicacion = {
      id: candidato.id,
      tipo: "busco_roomie",
      origen: "local",
      usuarioId: candidato.id,
      usuarioCreador: candidato.usuario,
      nombre: candidato.nombre,
      titulo: `Perfil de ${candidato.nombre}`,
      ubicacion: "Ubicacion no informada",
      descripcion: candidato.descripcion || "Usuario registrado con preferencias de convivencia.",
      presupuestoMaximo: Number(candidato.preferencias.presupuesto || 0),
      imagen: candidato.imagen,
      telefono: candidato.telefono,
      correo: candidato.correo,
      intereses: candidato.intereses,
      habitos: [
        candidato.preferencias.limpieza,
        candidato.preferencias.ambiente,
        candidato.preferencias.horario,
        candidato.preferencias.mascotas,
        candidato.preferencias.fumar,
      ],
    };

    saveLocalPublicacion(perfil);
    navigate(`/perfil/${candidato.id}`);
  };

  const guardarPreferencias = async () => {
    setMessage("");

    if (Number(compatibilidad.presupuesto) <= 0) {
      setMessage("Ingresa un presupuesto mayor a cero.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        preferenciasCompatibilidad: {
          ...compatibilidad,
          presupuesto: String(Number(compatibilidad.presupuesto)),
        },
      });
      setMessage("Preferencias actualizadas.");
    } catch {
      setMessage("No se pudieron guardar las preferencias.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver al inicio</button>
          <button className="btn btn-outline-success" onClick={() => navigate("/mi-perfil")}>Mi perfil</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Buscar por compatibilidad</h1>
        <p>Encuentra usuarios registrados con habitos, presupuesto y estilo de convivencia parecidos a los tuyos.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="compatibility-panel">
        <div className="compatibility-form">
          <span className="compatibility-kicker">Match inteligente</span>
          <h3>Tus preferencias</h3>
          <p>Ajusta tus habitos para buscar usuarios compatibles.</p>
          <div className="compatibility-grid">
            <select className="form-control" value={compatibilidad.limpieza} onChange={(e) => setCompatibilidad({ ...compatibilidad, limpieza: e.target.value })}>
              <option value="ordenado">Muy ordenado</option>
              <option value="intermedio">Orden intermedio</option>
              <option value="relajado">Relajado</option>
            </select>
            <select className="form-control" value={compatibilidad.ambiente} onChange={(e) => setCompatibilidad({ ...compatibilidad, ambiente: e.target.value })}>
              <option value="tranquilo">Ambiente tranquilo</option>
              <option value="social">Social</option>
              <option value="fiestas">Fiestas ocasionales</option>
            </select>
            <select className="form-control" value={compatibilidad.horario} onChange={(e) => setCompatibilidad({ ...compatibilidad, horario: e.target.value })}>
              <option value="madrugador">Madrugador</option>
              <option value="nocturno">Nocturno</option>
              <option value="flexible">Flexible</option>
            </select>
            <select className="form-control" value={compatibilidad.mascotas} onChange={(e) => setCompatibilidad({ ...compatibilidad, mascotas: e.target.value })}>
              <option value="sin_mascotas">Sin mascotas</option>
              <option value="mascotas">Pet-friendly</option>
              <option value="indiferente_mascotas">Me da igual</option>
            </select>
            <select className="form-control" value={compatibilidad.fumar} onChange={(e) => setCompatibilidad({ ...compatibilidad, fumar: e.target.value })}>
              <option value="no_fuma">No fumador</option>
              <option value="fuma">Fumador</option>
              <option value="indiferente_fuma">Me da igual</option>
            </select>
            <input className="form-control" type="number" min="1" placeholder="Presupuesto maximo" value={compatibilidad.presupuesto} onChange={(e) => setCompatibilidad({ ...compatibilidad, presupuesto: e.target.value })} />
          </div>

          <button className="btn btn-success w-100 mt-3" onClick={guardarPreferencias} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="compatibility-results">
          <div className="compatibility-results-title">
            <span>Usuarios compatibles</span>
            <strong>{candidatos.length} usuario(s)</strong>
          </div>
          {candidatos.length === 0 ? (
            <div className="sin-resultados">
              <p>Aun no hay otros usuarios registrados con preferencias guardadas.</p>
            </div>
          ) : (
            candidatos.map((candidato) => (
              <article
                className="compatibility-match"
                key={candidato.id}
                role="button"
                tabIndex={0}
                onClick={() => verPerfil(candidato)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") verPerfil(candidato);
                }}
              >
                <img src={candidato.imagen || avatar4} alt={candidato.nombre} />
                <div className="match-copy">
                  <div className="match-topline">
                    <span className="match-name">{candidato.nombre}</span>
                    <strong>{candidato.score}% compatible</strong>
                    <div className="match-score-bar">
                      <span style={{ width: `${candidato.score}%` }} />
                    </div>
                  </div>
                  <small>{candidato.descripcion}</small>
                  <small>
                    {candidato.telefono ? `Telefono: ${candidato.telefono}` : "Telefono no informado"}
                    {candidato.correo ? ` - ${candidato.correo}` : ""}
                  </small>
                  <div className="match-tags">
                    {preferenciasTags(candidato.preferencias).map((tag) => <em key={tag}>{tag}</em>)}
                    {candidato.intereses.slice(0, 3).map((interes) => <em key={interes}>{interes}</em>)}
                  </div>
                  <div className="match-actions">
                    <button
                      className="btn btn-outline-success btn-sm"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        verPerfil(candidato);
                      }}
                    >
                      Ver perfil
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
