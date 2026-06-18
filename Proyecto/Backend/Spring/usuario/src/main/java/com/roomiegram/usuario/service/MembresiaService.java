package com.roomiegram.usuario.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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

        return suscripcionRepository
                .findTopByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .filter(suscripcion -> suscripcion.getEstado() == EstadoSuscripcion.ACTIVA)
                .orElseGet(() -> suscripcionGratisVirtual(usuarioId));
    }

    public List<Suscripcion> historial(Long usuarioId) {
        validarUsuario(usuarioId);
        return suscripcionRepository.findAllByUsuarioId(usuarioId);
    }

    public Suscripcion suscribir(Long usuarioId, Plan plan, boolean renovacionAutomatica) {
        validarUsuario(usuarioId);
        if (plan == null) {
            throw new IllegalArgumentException("Plan no valido");
        }

        suscripcionRepository.findTopByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .filter(suscripcion -> suscripcion.getEstado() == EstadoSuscripcion.ACTIVA)
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

        suscripcionRepository.findTopByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .filter(suscripcion -> suscripcion.getEstado() == EstadoSuscripcion.ACTIVA)
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
                                "Gestion basica de tareas y gastos",
                                "Notificaciones internas y por correo disponibles")),
                Map.of(
                        "id", "PREMIUM_INDIVIDUAL",
                        "nombre", "Premium Individual",
                        "precio", 4990,
                        "descripcion", "Plan demostrativo para quienes buscan roomie con mas organizacion",
                        "beneficios", List.of(
                                "Suscripcion activa con vigencia mensual",
                                "Gestion de perfil y preferencias",
                                "Acceso a solicitudes e invitaciones del hogar",
                                "Avisos por correo para solicitudes y tareas",
                                "Historial de suscripciones")),
                Map.of(
                        "id", "PREMIUM_HOGAR",
                        "nombre", "Premium Hogar",
                        "precio", 8990,
                        "descripcion", "Plan demostrativo para grupos que quieren convivir mejor",
                        "beneficios", List.of(
                                "Todo lo de Premium Individual",
                                "Panel de convivencia del hogar",
                                "Organizacion de tareas compartidas",
                                "Gestion de gastos y comprobantes",
                                "Solicitudes de ingreso con aviso por correo",
                                "Suscripcion de hogar con vigencia mensual")));
    }

    private void validarUsuario(Long usuarioId) {
        if (usuarioId == null || !registerRepository.existsById(usuarioId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
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
