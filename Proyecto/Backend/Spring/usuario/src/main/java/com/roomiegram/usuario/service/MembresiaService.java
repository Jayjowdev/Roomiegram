package com.roomiegram.usuario.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.roomiegram.usuario.enums.EstadoSuscripcion;
import com.roomiegram.usuario.enums.Plan;
import com.roomiegram.usuario.model.Suscripcion;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.repository.SuscripcionRepository;

@Service
public class MembresiaService {

    private final SuscripcionRepository suscripcionRepository;
    private final RegisterRepository registerRepository;

    public MembresiaService(SuscripcionRepository suscripcionRepository, RegisterRepository registerRepository) {
        this.suscripcionRepository = suscripcionRepository;
        this.registerRepository = registerRepository;
    }

    public Suscripcion obtenerActiva(Long usuarioId) {
        validarUsuario(usuarioId);

        return buscarSuscripcionActiva(usuarioId)
                .orElseGet(() -> suscripcionGratisVirtual(usuarioId));
    }

    public List<Suscripcion> historial(Long usuarioId) {
        validarUsuario(usuarioId);
        return suscripcionRepository.findAllByUsuarioId(usuarioId);
    }

    public Suscripcion suscribir(Long usuarioId, Plan plan, boolean renovacionAutomatica) {
        validarUsuario(usuarioId);
        if (plan == null) {
            throw new IllegalArgumentException("Plan no válido");
        }

        buscarSuscripcionActiva(usuarioId)
                .ifPresent(suscripcion -> {
                    suscripcion.setEstado(EstadoSuscripcion.CANCELADA);
                    suscripcionRepository.save(suscripcion);
                });

        LocalDate inicio = LocalDate.now();
        Suscripcion nueva = new Suscripcion();
        nueva.setUsuarioId(usuarioId);
        nueva.setPlan(plan);
        nueva.setEstado(EstadoSuscripcion.ACTIVA);
        nueva.setFechaInicio(inicio);
        nueva.setFechaFin(plan == Plan.GRATIS ? null : inicio.plusMonths(1));
        nueva.setRenovacionAutomatica(plan != Plan.GRATIS && renovacionAutomatica);

        return suscripcionRepository.save(nueva);
    }

    public void cancelar(Long usuarioId) {
        validarUsuario(usuarioId);

        buscarSuscripcionActiva(usuarioId)
                .ifPresent(suscripcion -> {
                    suscripcion.setEstado(EstadoSuscripcion.CANCELADA);
                    suscripcionRepository.save(suscripcion);
                });
    }

    public List<Map<String, Object>> obtenerPlanes() {
        return List.of(
                Map.of(
                        "id", "GRATIS",
                        "nombre", "Gratis",
                        "precio", 0,
                        "descripcion", "Para empezar a encontrar tu roomie ideal",
                        "beneficios", List.of(
                                "Crear publicaciones y perfiles roomie",
                                "Busqueda por tipo y ubicacion",
                                "Unirse o crear un hogar compartido",
                                "Ver datos basicos del hogar",
                                "Notificaciones internas y por correo disponibles")),
                Map.of(
                        "id", "PREMIUM_INDIVIDUAL",
                        "nombre", "Premium Individual",
                        "precio", 4990,
                        "descripcion", "Para destacar tu perfil, publicaciones y compatibilidad al buscar roomie",
                        "beneficios", List.of(
                                "Perfil y publicaciones destacadas",
                                "Compatibilidad avanzada",
                                "Todos los matches visibles",
                                "Mayor visibilidad en busqueda y resultados",
                                "Recomendacion final por match")),
                Map.of(
                        "id", "PREMIUM_HOGAR",
                        "nombre", "Premium Hogar",
                        "precio", 8990,
                        "descripcion", "Para hogares que necesitan gestion operativa completa",
                        "beneficios", List.of(
                                "Beneficio grupal para integrantes actuales",
                                "Tareas del hogar",
                                "Gastos compartidos",
                                "Subir y ver comprobantes",
                                "Actividad y acciones de convivencia")));
    }

    public Map<String, Object> obtenerBeneficios(Long usuarioId) {
        Suscripcion suscripcion = obtenerActiva(usuarioId);
        Plan plan = suscripcion.getPlan() == null ? Plan.GRATIS : suscripcion.getPlan();
        boolean premiumIndividual = plan == Plan.PREMIUM_INDIVIDUAL;
        boolean premiumHogar = plan == Plan.PREMIUM_HOGAR;

        return Map.ofEntries(
                Map.entry("usuarioId", usuarioId),
                Map.entry("plan", plan.name()),
                Map.entry("busquedaBasica", true),
                Map.entry("compatibilidadBasica", true),
                Map.entry("resenasBasicas", true),
                Map.entry("crudBasico", true),
                Map.entry("compatibilidadDetallada", premiumIndividual),
                Map.entry("perfilDestacado", premiumIndividual),
                Map.entry("publicacionesDestacadas", premiumIndividual),
                Map.entry("resenasDestacadas", premiumIndividual),
                Map.entry("mejoresMatches", premiumIndividual),
                Map.entry("gestionHogarOperativa", premiumHogar),
                Map.entry("tareasHogar", premiumHogar),
                Map.entry("gastosHogar", premiumHogar),
                Map.entry("comprobantesHogar", premiumHogar),
                Map.entry("reportesHogarAvanzados", premiumHogar),
                Map.entry("actividadHogarAvanzada", premiumHogar),
                Map.entry("recomendacionesConvivencia", premiumHogar));
    }

    private void validarUsuario(Long usuarioId) {
        if (usuarioId == null || !registerRepository.existsById(usuarioId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
    }

    private Optional<Suscripcion> buscarSuscripcionActiva(Long usuarioId) {
        return suscripcionRepository.findTopByUsuarioIdAndEstadoOrderByFechaInicioDescIdDesc(
                usuarioId,
                EstadoSuscripcion.ACTIVA);
    }

    private Suscripcion suscripcionGratisVirtual(Long usuarioId) {
        Suscripcion gratis = new Suscripcion();
        gratis.setUsuarioId(usuarioId);
        gratis.setPlan(Plan.GRATIS);
        gratis.setEstado(EstadoSuscripcion.ACTIVA);
        gratis.setFechaInicio(LocalDate.now());
        gratis.setRenovacionAutomatica(false);
        return gratis;
    }
}
