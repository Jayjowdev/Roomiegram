package com.roomiegram.hogar.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.hogar.dto.ActualizarVisitaAdminRequest;
import com.roomiegram.hogar.dto.AdminActionRequest;
import com.roomiegram.hogar.dto.CrearVisitaRequest;
import com.roomiegram.hogar.dto.CreateHogarRequest;
import com.roomiegram.hogar.dto.RecursoHogarRequest;
import com.roomiegram.hogar.dto.UsuarioRequest;
import com.roomiegram.hogar.model.EstadoVisita;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.model.Visita;
import com.roomiegram.hogar.repository.HogarRepository;
import com.roomiegram.hogar.repository.VisitaRepository;

@Service
public class HogarService {

    private final HogarRepository hogarRepository;
    private final VisitaRepository visitaRepository;
    private final NotificationPublisher notificationPublisher;
    private final RestTemplate restTemplate;

    @Value("${usuario.service.url}")
    private String usuarioServiceUrl;

    public HogarService(HogarRepository hogarRepository, VisitaRepository visitaRepository,
            NotificationPublisher notificationPublisher, RestTemplate restTemplate) {
        this.hogarRepository = hogarRepository;
        this.visitaRepository = visitaRepository;
        this.notificationPublisher = notificationPublisher;
        this.restTemplate = restTemplate;
    }

    public Hogar crearHogar(CreateHogarRequest request) {
        validarCreacion(request);
        validarSuscripcionParaCrearHogar(request.usuarioCreadorId());

        Hogar hogar = new Hogar();
        hogar.setNombre(request.nombre().trim());
        hogar.setDescripcion(limpiarTexto(request.descripcion()));
        hogar.setUsuarioCreadorId(request.usuarioCreadorId());
        hogar.setUsuarioAdministradorId(request.usuarioCreadorId());
        hogar.setActivo(true);

        return hogarRepository.save(hogar);
    }

    public List<Hogar> listarHogares() {
        return hogarRepository.findAll();
    }

    public Hogar obtenerPorId(Long hogarId) {
        return buscarHogar(hogarId);
    }

    public Hogar solicitarIngreso(Long hogarId, UsuarioRequest request) {
        validarUsuarioRequest(request);

        Hogar hogar = buscarHogar(hogarId);
        if (hogar.getIntegrantesIds().contains(request.usuarioId())) {
            throw new IllegalArgumentException("Ya formas parte de este hogar");
        }
        if (hogar.getSolicitudesPendientesIds().contains(request.usuarioId())) {
            throw new IllegalArgumentException("Ya tienes una solicitud pendiente para este hogar");
        }
        if (!tieneVisitaRealizada(hogarId, request.usuarioId())) {
            throw new IllegalArgumentException(
                    "Debes completar una visita al hogar antes de solicitar ingreso. Agenda tu visita desde el panel de hogares.");
        }

        if (!hogar.solicitarIngreso(request.usuarioId())) {
            throw new IllegalArgumentException("La solicitud no se pudo registrar");
        }

        Hogar hogarActualizado = hogarRepository.save(hogar);

        try {
            notificationPublisher.publicarSolicitudIngreso(hogarActualizado, request.usuarioId());
            return hogarActualizado;
        } catch (RuntimeException exception) {
            hogar.rechazarSolicitud(request.usuarioId());
            hogarRepository.save(hogar);
            throw new IllegalStateException("No se pudo notificar al administrador del hogar", exception);
        }
    }

    public Hogar aprobarSolicitud(Long hogarId, Long usuarioId, AdminActionRequest request) {
        validarAdministrador(request);

        Hogar hogar = buscarHogar(hogarId);
        validarAdministradorDelHogar(hogar, request.administradorId());

        if (!hogar.aprobarSolicitud(usuarioId)) {
            throw new IllegalArgumentException("La solicitud pendiente no existe para ese usuario");
        }

        return hogarRepository.save(hogar);
    }

    public Hogar rechazarSolicitud(Long hogarId, Long usuarioId, AdminActionRequest request) {
        validarAdministrador(request);

        Hogar hogar = buscarHogar(hogarId);
        validarAdministradorDelHogar(hogar, request.administradorId());

        if (!hogar.rechazarSolicitud(usuarioId)) {
            throw new IllegalArgumentException("La solicitud pendiente no existe para ese usuario");
        }

        return hogarRepository.save(hogar);
    }

    public Hogar removerIntegrante(Long hogarId, Long usuarioId, Long administradorId) {
        validarId(administradorId, "El administrador es obligatorio");

        Hogar hogar = buscarHogar(hogarId);
        validarAdministradorDelHogar(hogar, administradorId);

        if (!hogar.removerIntegrante(usuarioId)) {
            throw new IllegalArgumentException("No fue posible remover al integrante indicado");
        }

        return hogarRepository.save(hogar);
    }

    public Visita crearVisita(CrearVisitaRequest request) {
        validarCreacionVisita(request);

        Hogar hogar = buscarHogar(request.hogarId());
        if (hogar.getIntegrantesIds().contains(request.usuarioVisitanteId())) {
            throw new IllegalArgumentException("Ya eres integrante de este hogar, no necesitas agendar una visita");
        }
        if (visitaRepository.existsByHogarIdAndUsuarioVisitanteIdAndEstado(
                request.hogarId(), request.usuarioVisitanteId(), EstadoVisita.PENDIENTE)) {
            throw new IllegalArgumentException("Ya tienes una visita pendiente para este hogar");
        }

        Visita visita = new Visita();
        visita.setHogarId(request.hogarId());
        visita.setUsuarioVisitanteId(request.usuarioVisitanteId());
        visita.setFechaVisita(request.fechaVisita());
        visita.setComentarios(limpiarTexto(request.comentarios()));
        visita.setEstado(EstadoVisita.PENDIENTE);

        Visita visitaGuardada = visitaRepository.save(visita);

        try {
            notificationPublisher.publicarNuevaVisita(hogar, visitaGuardada);
        } catch (RuntimeException exception) {
            // La visita se conserva aunque falle la notificación
        }

        return visitaGuardada;
    }

    public List<Visita> listarVisitasPorHogar(Long hogarId) {
        validarId(hogarId, "El id del hogar es obligatorio");
        return visitaRepository.findByHogarIdOrderByFechaVisitaDesc(hogarId);
    }

    public List<Visita> listarVisitasPorVisitante(Long usuarioVisitanteId) {
        validarId(usuarioVisitanteId, "El id del usuario visitante es obligatorio");
        return visitaRepository.findByUsuarioVisitanteIdOrderByFechaVisitaDesc(usuarioVisitanteId);
    }

    public List<Visita> listarVisitasPorHogarYVisitante(Long hogarId, Long usuarioVisitanteId) {
        validarId(hogarId, "El id del hogar es obligatorio");
        validarId(usuarioVisitanteId, "El id del usuario visitante es obligatorio");
        return visitaRepository.findByHogarIdAndUsuarioVisitanteIdOrderByFechaVisitaDesc(hogarId, usuarioVisitanteId);
    }

    public Visita obtenerVisita(Long visitaId) {
        return buscarVisita(visitaId);
    }

    public Visita actualizarEstadoVisita(Long visitaId, ActualizarVisitaAdminRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de actualización es obligatoria");
        }
        validarId(request.administradorId(), "El administrador es obligatorio");

        Visita visita = buscarVisita(visitaId);
        Hogar hogar = buscarHogar(visita.getHogarId());
        validarAdministradorDelHogar(hogar, request.administradorId());

        EstadoVisita nuevoEstado = parsearEstadoVisita(request.estado());
        visita.setEstado(nuevoEstado);
        if (request.comentarios() != null) {
            visita.setComentarios(limpiarTexto(request.comentarios()));
        }

        Visita visitaActualizada = visitaRepository.save(visita);

        try {
            notificationPublisher.publicarVisitaActualizada(hogar, visitaActualizada);
        } catch (RuntimeException exception) {
            // La actualización se conserva aunque falle la notificación
        }

        return visitaActualizada;
    }

    public Hogar agregarTarea(Long hogarId, RecursoHogarRequest request) {
        return agregarRecurso(hogarId, request, TipoRecurso.TAREA);
    }

    public Hogar agregarCuenta(Long hogarId, RecursoHogarRequest request) {
        return agregarRecurso(hogarId, request, TipoRecurso.CUENTA);
    }

    public Hogar agregarComprobante(Long hogarId, RecursoHogarRequest request) {
        return agregarRecurso(hogarId, request, TipoRecurso.COMPROBANTE);
    }

    public Hogar agregarPublicacion(Long hogarId, RecursoHogarRequest request) {
        return agregarRecurso(hogarId, request, TipoRecurso.PUBLICACION);
    }

    public void eliminarHogar(Long hogarId, Long administradorId) {
        validarId(administradorId, "El administrador es obligatorio");

        Hogar hogar = buscarHogar(hogarId);
        validarAdministradorDelHogar(hogar, administradorId);
        hogarRepository.delete(hogar);
    }

    private boolean tieneVisitaRealizada(Long hogarId, Long usuarioVisitanteId) {
        return visitaRepository.existsByHogarIdAndUsuarioVisitanteIdAndEstado(
                hogarId, usuarioVisitanteId, EstadoVisita.REALIZADA);
    }

    private Hogar agregarRecurso(Long hogarId, RecursoHogarRequest request, TipoRecurso tipoRecurso) {
        validarRecursoRequest(request);

        Hogar hogar = buscarHogar(hogarId);
        validarAdministradorDelHogar(hogar, request.administradorId());

        boolean agregado = switch (tipoRecurso) {
            case TAREA -> hogar.agregarTarea(request.recursoId());
            case CUENTA -> hogar.agregarHogarCuenta(request.recursoId());
            case COMPROBANTE -> hogar.agregarComprobante(request.recursoId());
            case PUBLICACION -> hogar.agregarPublicacion(request.recursoId());
        };

        if (!agregado) {
            throw new IllegalArgumentException("El recurso ya estaba asociado al hogar o es invalido");
        }

        return hogarRepository.save(hogar);
    }

    private Hogar buscarHogar(Long hogarId) {
        validarId(hogarId, "El id del hogar es obligatorio");

        return hogarRepository.findById(hogarId)
                .orElseThrow(() -> new IllegalArgumentException("El hogar no existe"));
    }

    private Visita buscarVisita(Long visitaId) {
        validarId(visitaId, "El id de la visita es obligatorio");

        return visitaRepository.findById(visitaId)
                .orElseThrow(() -> new IllegalArgumentException("La visita no existe"));
    }

    private void validarCreacion(CreateHogarRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud del hogar es obligatoria");
        }
        if (request.nombre() == null || request.nombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del hogar es obligatorio");
        }
        validarId(request.usuarioCreadorId(), "El usuario creador es obligatorio");
    }

    private void validarCreacionVisita(CrearVisitaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de visita es obligatoria");
        }
        validarId(request.hogarId(), "El hogar es obligatorio");
        validarId(request.usuarioVisitanteId(), "El usuario visitante es obligatorio");
        if (request.fechaVisita() == null) {
            throw new IllegalArgumentException("La fecha de visita es obligatoria");
        }
        if (request.fechaVisita().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new IllegalArgumentException("La fecha de visita no puede estar en el pasado");
        }
    }

    private EstadoVisita parsearEstadoVisita(String estado) {
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El estado de la visita es obligatorio");
        }
        try {
            return EstadoVisita.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de visita invalido. Valores permitidos: PENDIENTE, REALIZADA, CANCELADA");
        }
    }

    @SuppressWarnings("unchecked")
    private void validarSuscripcionParaCrearHogar(Long usuarioId) {
        if (usuarioId == null || usuarioId <= 0) {
            throw new IllegalArgumentException("El usuario creador es obligatorio");
        }

        String url = usuarioServiceUrl + "/auth/membresias/usuario/" + usuarioId;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("No se pudo verificar la suscripcion del usuario");
            }

            Object plan = response.getBody().get("plan");
            if (plan == null || "GRATIS".equalsIgnoreCase(plan.toString())) {
                throw new IllegalArgumentException(
                        "Los usuarios con plan gratuito no pueden crear grupos de hogar. Actualiza tu suscripcion.");
            }
        } catch (RestClientException e) {
            throw new IllegalArgumentException("No se pudo verificar la suscripcion del usuario: " + e.getMessage());
        }
    }

    private void validarUsuarioRequest(UsuarioRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud del usuario es obligatoria");
        }
        validarId(request.usuarioId(), "El usuario es obligatorio");
    }

    private void validarAdministrador(AdminActionRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud del administrador es obligatoria");
        }
        validarId(request.administradorId(), "El administrador es obligatorio");
    }

    private void validarRecursoRequest(RecursoHogarRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud del recurso es obligatoria");
        }
        validarId(request.administradorId(), "El administrador es obligatorio");
        validarId(request.recursoId(), "El recurso es obligatorio");
    }

    private void validarAdministradorDelHogar(Hogar hogar, Long administradorId) {
        if (!hogar.esAdministrador(administradorId)) {
            throw new IllegalArgumentException("Solo el administrador del hogar puede realizar esta accion");
        }
    }

    private void validarId(Long value, String message) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private String limpiarTexto(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        return texto.trim();
    }

    private enum TipoRecurso {
        TAREA,
        CUENTA,
        COMPROBANTE,
        PUBLICACION
    }
}
