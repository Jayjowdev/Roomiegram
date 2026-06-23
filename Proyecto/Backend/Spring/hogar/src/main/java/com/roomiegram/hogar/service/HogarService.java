package com.roomiegram.hogar.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.roomiegram.hogar.dto.AdminActionRequest;
import com.roomiegram.hogar.dto.CreateHogarRequest;
import com.roomiegram.hogar.dto.RecursoHogarRequest;
import com.roomiegram.hogar.dto.UsuarioRequest;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.repository.HogarRepository;

@Service
public class HogarService {

    private final HogarRepository hogarRepository;
    private final NotificationPublisher notificationPublisher;

    public HogarService(HogarRepository hogarRepository, NotificationPublisher notificationPublisher) {
        this.hogarRepository = hogarRepository;
        this.notificationPublisher = notificationPublisher;
    }

    public Hogar crearHogar(CreateHogarRequest request) {
        validarCreacion(request);

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

    private void validarCreacion(CreateHogarRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud del hogar es obligatoria");
        }
        if (request.nombre() == null || request.nombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del hogar es obligatorio");
        }
        validarId(request.usuarioCreadorId(), "El usuario creador es obligatorio");
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
