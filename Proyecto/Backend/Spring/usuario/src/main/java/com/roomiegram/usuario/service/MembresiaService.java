package com.roomiegram.usuario.service;

import com.roomiegram.usuario.enums.EstadoSuscripcion;
import com.roomiegram.usuario.enums.Plan;
import com.roomiegram.usuario.model.Suscripcion;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.repository.SuscripcionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class MembresiaService {

    private final SuscripcionRepository suscripcionRepository;
    private final RegisterRepository registerRepository;

    public MembresiaService(SuscripcionRepository suscripcionRepository, RegisterRepository registerRepository) {
        this.suscripcionRepository = suscripcionRepository;
        this.registerRepository = registerRepository;
    }

    /** Devuelve la suscripcion activa mas reciente del usuario, o GRATIS si no tiene ninguna. */
    public Suscripcion obtenerActiva(Long usuarioId) {
        return suscripcionRepository
                .findTopByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .filter(s -> s.getEstado() == EstadoSuscripcion.ACTIVA)
                .orElseGet(() -> suscripcionGratisVirtual(usuarioId));
    }

    /** Historial de suscripciones del usuario. */
    public List<Suscripcion> historial(Long usuarioId) {
        return suscripcionRepository.findAllByUsuarioId(usuarioId);
    }

    /**
     * Suscribe al usuario a un plan.
     * Si ya tiene una suscripcion activa distinta, la cancela primero.
     */
    public Suscripcion suscribir(Long usuarioId, Plan plan, boolean renovacionAutomatica) {
        if (!registerRepository.existsById(usuarioId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }

        // Cancelar suscripcion activa previa (si existe y es distinta al plan solicitado)
        suscripcionRepository.findTopByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .filter(s -> s.getEstado() == EstadoSuscripcion.ACTIVA)
                .ifPresent(s -> {
                    s.setEstado(EstadoSuscripcion.CANCELADA);
                    suscripcionRepository.save(s);
                });

        LocalDate inicio = LocalDate.now();
        LocalDate fin = plan == Plan.GRATIS ? null : inicio.plusMonths(1);

        Suscripcion nueva = new Suscripcion();
        nueva.setUsuarioId(usuarioId);
        nueva.setPlan(plan);
        nueva.setEstado(EstadoSuscripcion.ACTIVA);
        nueva.setFechaInicio(inicio);
        nueva.setFechaFin(fin);
        nueva.setRenovacionAutomatica(plan != Plan.GRATIS && renovacionAutomatica);

        return suscripcionRepository.save(nueva);
    }

    /** Cancela la suscripcion activa del usuario (queda en plan GRATIS virtual). */
    public void cancelar(Long usuarioId) {
        suscripcionRepository.findTopByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .filter(s -> s.getEstado() == EstadoSuscripcion.ACTIVA)
                .ifPresent(s -> {
                    s.setEstado(EstadoSuscripcion.CANCELADA);
                    suscripcionRepository.save(s);
                });
    }

    /** Retorna los planes disponibles con sus beneficios y precios. */
    public List<Map<String, Object>> obtenerPlanes() {
        return List.of(
            Map.of(
                "id", "GRATIS",
                "nombre", "Gratis",
                "precio", 0,
                "descripcion", "Para empezar a encontrar tu roomie ideal",
                "beneficios", List.of(
                    "1 publicacion activa",
                    "Busqueda basica de roomies",
                    "1 hogar compartido",
                    "Gestion de tareas y gastos",
                    "Notificaciones estandar"
                )
            ),
            Map.of(
                "id", "PREMIUM_INDIVIDUAL",
                "nombre", "Premium Individual",
                "precio", 4990,
                "descripcion", "Para quienes buscan roomie con mas ventajas",
                "beneficios", List.of(
                    "Hasta 5 publicaciones activas",
                    "Mayor visibilidad en resultados",
                    "Filtros avanzados de compatibilidad",
                    "Publicaciones destacadas",
                    "Historial ampliado de comprobantes",
                    "Notificaciones prioritarias"
                )
            ),
            Map.of(
                "id", "PREMIUM_HOGAR",
                "nombre", "Premium Hogar",
                "precio", 8990,
                "descripcion", "Para grupos que quieren convivir mejor",
                "beneficios", List.of(
                    "Todo lo de Premium Individual",
                    "Hasta 10 integrantes por hogar",
                    "Reportes de gastos compartidos",
                    "Exportacion de comprobantes",
                    "Recordatorios automaticos de pagos",
                    "Metricas de convivencia del grupo"
                )
            )
        );
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
