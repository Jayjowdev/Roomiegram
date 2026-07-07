import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png";
import avatar4 from "../assets/avatar4.svg";
import { LogoutButton } from "../components/LogoutButton";
import { useAuth } from "../context/AuthContext";
import { hogarService } from "../services/hogarService";
import { beneficiosFallback, membresiaService, PLAN_BADGE_CLASS, type BeneficiosPlan } from "../services/membresiaService";
import { notificacionService } from "../services/notificacionService";
import { publicacionService } from "../services/publicacionService";
import { usuarioService } from "../services/usuarioService";
import type { PreferenciasCompatibilidad } from "../types/auth";
import type { Hogar } from "../types/Hogar";
import type { Publicacion } from "../types/Publicacion";
import type { UsuarioResumen } from "../types/Usuario";
import { preferenciasIniciales, preferenciasLabels } from "../utils/preferenciasCompatibilidad";

type MatchCandidate = {
  id: number
  nombre: string
  usuario: string
  hogarActual?: string
  descripcion?: string
  imagen?: string
  preferencias: PreferenciasCompatibilidad
  intereses: string[]
  score: number
  coincidencias: string[]
  diferencias: string[]
  telefono?: string
  publicacionBuscaRoomie?: Publicacion
  publicacionCasa?: Publicacion
  hogarDisponible?: Hogar
  perteneceAHogar?: Hogar
  beneficios: BeneficiosPlan
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

function normalizarPreferencias(preferencias?: Partial<PreferenciasCompatibilidad> | null): PreferenciasCompatibilidad | null {
  if (!preferencias) return null;

  const normalizadas = {
    limpieza: preferencias.limpieza || "",
    ambiente: preferencias.ambiente || "",
    horario: preferencias.horario || "",
    mascotas: preferencias.mascotas || "",
    fumar: preferencias.fumar || "",
    presupuesto: String(preferencias.presupuesto || ""),
  };

  return tienePreferenciasCompletas(normalizadas) ? normalizadas : null;
}

function labelPreferencia(campo: keyof Omit<PreferenciasCompatibilidad, "presupuesto">, valor: string) {
  const labels = preferenciasLabels[campo] as Record<string, string>;
  return labels[valor] || valor.replaceAll("_", " ");
}

function evaluarCoincidencias(preferencias: PreferenciasCompatibilidad, candidato: PreferenciasCompatibilidad) {
  const campos: Array<keyof Omit<PreferenciasCompatibilidad, "presupuesto">> = ["limpieza", "ambiente", "horario", "mascotas", "fumar"];
  const coincidencias: string[] = [];
  const diferencias: string[] = [];

  campos.forEach((campo) => {
    const valorUsuario = preferencias[campo] || "";
    const valorCandidato = candidato[campo] || "";
    if (!valorUsuario || !valorCandidato) return;

    if (valorUsuario === valorCandidato || valorUsuario.startsWith("indiferente") || valorCandidato.startsWith("indiferente")) {
      coincidencias.push(labelPreferencia(campo, valorCandidato));
      return;
    }

    diferencias.push(`${labelPreferencia(campo, valorUsuario)} / ${labelPreferencia(campo, valorCandidato)}`);
  });

  return { coincidencias, diferencias };
}

function normalizarTexto(valor?: string) {
  return valor?.trim().toLowerCase() || "";
}

function getTelefonoContacto(telefono?: string) {
  const value = telefono?.trim();
  return value || "Teléfono no informado";
}

function getPublicacionCasaDelHogar(hogar: Hogar | undefined, publicaciones: Publicacion[]) {
  if (!hogar?.publicacionIds?.length) return undefined;
  return hogar.publicacionIds
    .map((publicacionId) => publicaciones.find((publicacion) => publicacion.id === publicacionId))
    .find((publicacion): publicacion is Publicacion => !!publicacion && publicacion.tipo !== "busco_roomie");
}

function getEstadoCandidato(candidato: MatchCandidate) {
  if (candidato.publicacionCasa && candidato.hogarDisponible) return "Ofrece casa";
  if (candidato.publicacionBuscaRoomie) return "Busca casa";
  if (candidato.perteneceAHogar) return "Pertenece a un hogar";
  return "Perfil compatible";
}

export default function Compatibilidad() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [compatibilidad, setCompatibilidad] = useState<PreferenciasCompatibilidad>(user?.preferenciasCompatibilidad || preferenciasIniciales);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [selectedHogarId, setSelectedHogarId] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [beneficiosUsuarios, setBeneficiosUsuarios] = useState<Record<number, BeneficiosPlan>>({});

  useEffect(() => {
    Promise.allSettled([usuarioService.listar(), publicacionService.listar(), hogarService.listar()])
      .then(([usuariosResult, publicacionesResult, hogaresResult]) => {
        if (usuariosResult.status === "fulfilled") setUsuarios(usuariosResult.value);
        if (publicacionesResult.status === "fulfilled") setPublicaciones(publicacionesResult.value);
        if (hogaresResult.status === "fulfilled") setHogares(hogaresResult.value);
        if ([usuariosResult, publicacionesResult, hogaresResult].some((result) => result.status === "rejected")) {
          setMessage("Algunos datos de compatibilidad no se pudieron cargar.");
        }
      });
  }, []);

  const hogaresAdministrables = useMemo(() => {
    if (!user?.id) return [];
    return hogares.filter((hogar) => hogar.usuarioAdministradorId === user.id || hogar.usuarioCreadorId === user.id);
  }, [hogares, user?.id]);

  useEffect(() => {
    if (!selectedHogarId && hogaresAdministrables.length === 1) {
      setSelectedHogarId(String(hogaresAdministrables[0].id));
    }
  }, [hogaresAdministrables, selectedHogarId]);

  useEffect(() => {
    const ids = [...new Set([user?.id, ...usuarios.map((usuario) => usuario.id)].filter((id): id is number => !!id))];
    if (!ids.length) {
      setBeneficiosUsuarios({});
      return;
    }

    let isMounted = true;

    Promise.allSettled(ids.map((usuarioId) => membresiaService.obtenerBeneficios(usuarioId)))
      .then((results) => {
        if (!isMounted) return;

        const beneficios = results.reduce<Record<number, BeneficiosPlan>>((acc, result, index) => {
          const usuarioId = ids[index];
          acc[usuarioId] = result.status === "fulfilled"
            ? result.value
            : beneficiosFallback(usuarioId);
          return acc;
        }, {});

        setBeneficiosUsuarios(beneficios);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, usuarios]);

  const candidatos = useMemo<MatchCandidate[]>(() => {
    return usuarios
      .filter((usuario) => usuario.id !== user?.id && usuario.cuentaActiva !== false)
      .map((usuario) => ({
        usuario,
        preferencias: normalizarPreferencias(usuario.preferenciasCompatibilidad),
      }))
      .filter((item): item is { usuario: UsuarioResumen; preferencias: PreferenciasCompatibilidad } => !!item.preferencias)
      .map((usuario) => {
        const preferencias = usuario.preferencias;
        const usuarioData = usuario.usuario;
        const usuarioNormalizado = normalizarTexto(usuarioData.usuario);
        const publicacionesUsuario = publicaciones.filter((publicacion) =>
          publicacion.usuarioId === usuarioData.id || normalizarTexto(publicacion.usuarioCreador) === usuarioNormalizado,
        );
        const publicacionBuscaRoomie = publicacionesUsuario.find((publicacion) => publicacion.tipo === "busco_roomie");
        const perteneceAHogar = hogares.find((hogar) =>
          hogar.usuarioAdministradorId === usuarioData.id
          || hogar.usuarioCreadorId === usuarioData.id
          || hogar.integrantesIds?.includes(usuarioData.id),
        );
        const publicacionCasaPropia = publicacionesUsuario.find((publicacion) => publicacion.tipo !== "busco_roomie");
        const publicacionCasaDelHogar = getPublicacionCasaDelHogar(perteneceAHogar, publicaciones);
        const publicacionCasa = publicacionCasaPropia || publicacionCasaDelHogar;
        const hogarDisponible = publicacionCasa
          ? hogares.find((hogar) => hogar.publicacionIds?.includes(publicacionCasa.id))
          : undefined;
        const { coincidencias, diferencias } = evaluarCoincidencias(compatibilidad, preferencias);
        const beneficios = beneficiosUsuarios[usuarioData.id] ?? beneficiosFallback(usuarioData.id);

        return {
          id: usuarioData.id,
          nombre: usuarioData.nombre || usuarioData.usuario,
          usuario: usuarioData.usuario,
          hogarActual: usuarioData.hogarActual,
          descripcion: usuarioData.descripcion || publicacionBuscaRoomie?.descripcion || "Usuario registrado con preferencias de convivencia.",
          imagen: usuarioData.fotoPerfil || publicacionBuscaRoomie?.imagen || avatar4,
          preferencias,
          intereses: usuarioData.intereses || [],
          telefono: usuarioData.telefono,
          score: scoreMatch(compatibilidad, preferencias),
          coincidencias,
          diferencias,
          publicacionBuscaRoomie,
          publicacionCasa,
          hogarDisponible,
          perteneceAHogar,
          beneficios,
        };
      })
      .sort((a, b) => Number(b.beneficios.perfilDestacado) - Number(a.beneficios.perfilDestacado) || b.score - a.score);
  }, [beneficiosUsuarios, compatibilidad, hogares, publicaciones, user?.id, usuarios]);

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

  const invitarAMiHogar = async (candidato: MatchCandidate) => {
    if (!user?.id || !selectedHogarId) return;

    const hogar = hogaresAdministrables.find((item) => String(item.id) === selectedHogarId);
    if (!hogar) {
      setMessage("Selecciona un hogar válido para enviar la invitación.");
      return;
    }

    setProcessingId(candidato.id);
    try {
      await notificacionService.crear({
        usuarioEmisorId: user.id,
        usuarioReceptorId: candidato.id,
        hogarId: hogar.id,
        referenciaId: hogar.id,
        tipo: "INVITACION_HOGAR",
        estado: "PENDIENTE",
        titulo: "Invitación a hogar Roomiegram",
        mensaje: `${user.nombre || user.usuario} te invitó a unirte al hogar ${hogar.nombre}.`,
      });
      setMessage(`Invitación enviada a ${candidato.nombre} para el hogar ${hogar.nombre}.`);
    } catch {
      setMessage("No se pudo enviar la invitación. La acción no modificó el hogar.");
    } finally {
      setProcessingId(null);
    }
  };

  const solicitarIngreso = async (candidato: MatchCandidate) => {
    if (!user?.id || !candidato.hogarDisponible) return;

    setProcessingId(candidato.id);
    try {
      const actualizado = await hogarService.solicitarIngreso(candidato.hogarDisponible.id, { usuarioId: user.id });
      setHogares((current) => current.map((hogar) => hogar.id === actualizado.id ? actualizado : hogar));
      setMessage(`Solicitud enviada al hogar ${actualizado.nombre}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const beneficiosUsuarioActual = user?.id ? beneficiosUsuarios[user.id] ?? beneficiosFallback(user.id) : beneficiosFallback(0);
  const compatibilidadDetallada = beneficiosUsuarioActual.compatibilidadDetallada;
  const limiteCoincidencias = compatibilidadDetallada ? 6 : 4;
  const limiteDiferencias = compatibilidadDetallada ? 4 : 2;

  return (
    <div className="module-page">
      <header className="module-header">
        <img src={logo} alt="RoomieGram" className="dashboard-logo" onClick={() => navigate("/home")} />
        <div className="dashboard-actions">
          <button className="btn btn-outline-success" onClick={() => navigate("/home")}>Volver al inicio</button>
          <LogoutButton />
        </div>
      </header>

      <section className="module-title">
        <h1>Buscar por compatibilidad</h1>
          <p>Encuentra personas compatibles, entiende por qué encajan contigo y elige la acción correcta según su contexto.</p>
      </section>

      {message && <p className="api-message">{message}</p>}

      <section className="compatibility-panel compatibility-panel-upgraded">
        <div className="compatibility-form">
          <span className="compatibility-kicker">{compatibilidadDetallada ? "Match Premium Individual" : "Match basico"}</span>
          <h3>Tus preferencias</h3>
          <p>Ajusta tus hábitos para buscar usuarios compatibles. Gratis mantiene la vista basica; Premium Individual muestra mas detalle.</p>
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
            <input className="form-control" type="number" min="1" placeholder="Presupuesto máximo" value={compatibilidad.presupuesto} onChange={(e) => setCompatibilidad({ ...compatibilidad, presupuesto: e.target.value })} />
          </div>

          {hogaresAdministrables.length > 1 && (
            <label className="field-label mt-3">
              <span>Hogar para invitaciones</span>
              <select className="form-control" value={selectedHogarId} onChange={(event) => setSelectedHogarId(event.target.value)}>
                <option value="">Selecciona un hogar</option>
                {hogaresAdministrables.map((hogar) => (
                  <option key={hogar.id} value={hogar.id}>{hogar.nombre}</option>
                ))}
              </select>
            </label>
          )}

          <button className="btn btn-success w-100 mt-3" onClick={guardarPreferencias} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="compatibility-results">
          <div className="compatibility-results-title">
            <span>Personas compatibles</span>
            <strong>{candidatos.length} resultado(s)</strong>
          </div>
          {candidatos.length === 0 ? (
            <div className="sin-resultados">
              <p>Aún no hay personas compatibles disponibles.</p>
              <p>Cuando otros usuarios completen sus preferencias de convivencia, aparecerán aquí.</p>
            </div>
          ) : (
            candidatos.map((candidato) => {
              const puedeSolicitarIngreso = !!candidato.hogarDisponible && !candidato.hogarDisponible.solicitudesPendientesIds?.includes(user?.id || 0);
              const puedeInvitar = !!candidato.publicacionBuscaRoomie && hogaresAdministrables.length > 0;
              const estado = getEstadoCandidato(candidato);

              return (
                <article className="compatibility-match compatibility-match-card" key={candidato.id}>
                  <img src={candidato.imagen || avatar4} alt={candidato.nombre} />
                  <div className="match-copy">
                    <div className="match-topline">
                      <span className="match-name">{candidato.nombre}</span>
                      <strong>{candidato.score}% compatible</strong>
                      {candidato.beneficios.perfilDestacado && (
                        <span className={`plan-badge ${PLAN_BADGE_CLASS.PREMIUM_INDIVIDUAL}`}>Premium destacado</span>
                      )}
                      <div className="match-score-bar">
                        <span style={{ width: `${candidato.score}%` }} />
                      </div>
                    </div>

                    <div className="match-context-row">
                      <span className="status-pill success">{estado}</span>
                      {candidato.hogarDisponible && <span className="status-pill">Hogar: {candidato.hogarDisponible.nombre}</span>}
                      {candidato.publicacionCasa && <span className="status-pill">Casa publicada</span>}
                    </div>

                    <p className="match-description">{candidato.descripcion}</p>
                    <p className="match-contact"><strong>Teléfono:</strong> {getTelefonoContacto(candidato.telefono)}</p>

                    <div className="match-insights">
                      <div>
                        <span className="match-insight-title">Coincidencias</span>
                        <div className="match-tags">
                          {candidato.coincidencias.slice(0, limiteCoincidencias).map((tag) => <em key={tag}>{tag}</em>)}
                          {candidato.intereses.slice(0, compatibilidadDetallada ? 4 : 2).map((interes) => <em key={interes}>{interes}</em>)}
                        </div>
                      </div>
                      {candidato.diferencias.length > 0 && (
                        <div>
                          <span className="match-insight-title">Diferencias</span>
                          <div className="match-tags match-tags-muted">
                            {candidato.diferencias.slice(0, limiteDiferencias).map((tag) => <em key={tag}>{tag}</em>)}
                          </div>
                        </div>
                      )}
                    </div>
                    {compatibilidadDetallada && (
                      <p className="form-helper">
                        Lectura Premium: este match se prioriza por coincidencias, diferencias e intereses visibles para comparar antes de invitar o solicitar ingreso.
                      </p>
                    )}

                    <div className="match-actions">
                      <button className="btn btn-outline-success btn-sm" type="button" onClick={() => navigate(`/perfil-publico/${candidato.id}`)}>
                        Ver perfil
                      </button>
                      {candidato.publicacionCasa && (
                        <button
                          className="btn btn-outline-success btn-sm"
                          type="button"
                          onClick={() => navigate(`/detalle-publicacion/${candidato.publicacionCasa!.id}`)}
                        >
                          Ver publicación de casa
                        </button>
                      )}
                      {puedeSolicitarIngreso && (
                        <button
                          className="btn btn-success btn-sm"
                          type="button"
                          disabled={processingId === candidato.id}
                          onClick={() => solicitarIngreso(candidato)}
                        >
                          {processingId === candidato.id ? "Enviando..." : "Solicitar ingreso"}
                        </button>
                      )}
                      {puedeInvitar && (
                        <button
                          className="btn btn-success btn-sm"
                          type="button"
                          disabled={processingId === candidato.id || (hogaresAdministrables.length > 1 && !selectedHogarId)}
                          onClick={() => invitarAMiHogar(candidato)}
                        >
                          {processingId === candidato.id ? "Invitando..." : "Invitar a mi hogar"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
