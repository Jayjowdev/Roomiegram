package com.roomiegram.hogar.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.hogar.dto.CrearVisitaRequest;
import com.roomiegram.hogar.dto.ProponerAlternativaVisitaRequest;
import com.roomiegram.hogar.dto.ResponderAlternativaVisitaRequest;
import com.roomiegram.hogar.dto.ResponderVisitaRequest;
import com.roomiegram.hogar.model.EstadoVisitaHogar;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.model.VisitaHogar;
import com.roomiegram.hogar.repository.HogarRepository;
import com.roomiegram.hogar.repository.VisitaHogarRepository;

@Service
public class VisitaHogarService {

    private static final List<EstadoVisitaHogar> ESTADOS_ABIERTOS = List.of(
            EstadoVisitaHogar.PENDIENTE,
            EstadoVisitaHogar.PROPUESTA_ALTERNATIVA);

    private final VisitaHogarRepository visitaRepository;
    private final HogarRepository hogarRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${notificacion.service.url:http://notificacion:8085}")
    private String notificacionServiceUrl;

    public VisitaHogarService(VisitaHogarRepository visitaRepository, HogarRepository hogarRepository) {
        this.visitaRepository = visitaRepository;
        this.hogarRepository = hogarRepository;
    }

    public VisitaHogar crearVisita(CrearVisitaRequest request) {
        validarCreacion(request);
        Hogar hogar = buscarHogar(request.hogarId());
        validarAnfitrion(hogar, request.anfitrionId());

        if (request.interesadoId().equals(request.anfitrionId())) {
            throw new IllegalArgumentException("No puedes solicitar una visita a tu propia publicacion");
        }
        if (hogar.getIntegrantesIds().contains(request.interesadoId())) {
            throw new IllegalArgumentException("Ya formas parte de este hogar");
        }

        boolean tieneVisitaAbierta = !visitaRepository
                .findByPublicacionIdAndInteresadoIdAndEstadoIn(
                        request.publicacionId(),
                        request.interesadoId(),
                        ESTADOS_ABIERTOS)
                .isEmpty();
        if (tieneVisitaAbierta) {
            throw new IllegalArgumentException("Ya tienes una visita pendiente para esta publicacion");
        }

        VisitaHogar visita = new VisitaHogar();
        visita.setPublicacionId(request.publicacionId());
        visita.setHogarId(request.hogarId());
        visita.setInteresadoId(request.interesadoId());
        visita.setAnfitrionId(request.anfitrionId());
        visita.setFechaHoraPropuesta(request.fechaHoraPropuesta());
        visita.setMensaje(limpiarTexto(request.mensaje()));
        visita.setEstado(EstadoVisitaHogar.PENDIENTE);

        VisitaHogar guardada = visitaRepository.save(visita);
        notificar(
                guardada,
                guardada.getInteresadoId(),
                guardada.getAnfitrionId(),
                "Nueva solicitud de visita",
                "Un usuario quiere coordinar una visita para conocer la publicacion antes de solicitar ingreso.");
        return guardada;
    }

    public List<VisitaHogar> listarPorUsuario(Long usuarioId) {
        validarId(usuarioId, "El usuario es obligatorio");
        return visitaRepository.findByInteresadoIdOrAnfitrionIdOrderByFechaActualizacionDescFechaCreacionDesc(
                usuarioId,
                usuarioId);
    }

    public List<VisitaHogar> listarPorHogar(Long hogarId) {
        buscarHogar(hogarId);
        return visitaRepository.findByHogarIdOrderByFechaActualizacionDescFechaCreacionDesc(hogarId);
    }

    public VisitaHogar obtenerPorId(Long visitaId) {
        return buscarVisita(visitaId);
    }

    public VisitaHogar aceptarVisita(Long visitaId, ResponderVisitaRequest request) {
        VisitaHogar visita = buscarVisita(visitaId);
        validarRespuestaAnfitrion(visita, request);
        validarEstado(visita, EstadoVisitaHogar.PENDIENTE);

        visita.setEstado(EstadoVisitaHogar.ACEPTADA);
        visita.setRespuestaAnfitrion(limpiarTexto(request.mensaje()));

        VisitaHogar guardada = visitaRepository.save(visita);
        notificar(
                guardada,
                guardada.getAnfitrionId(),
                guardada.getInteresadoId(),
                "Visita aceptada",
                "Tu solicitud de visita fue aceptada. Ahora puedes avanzar con la solicitud de ingreso.");
        return guardada;
    }

    public VisitaHogar rechazarVisita(Long visitaId, ResponderVisitaRequest request) {
        VisitaHogar visita = buscarVisita(visitaId);
        validarRespuestaAnfitrion(visita, request);
        if (visita.getEstado() != EstadoVisitaHogar.PENDIENTE
                && visita.getEstado() != EstadoVisitaHogar.PROPUESTA_ALTERNATIVA) {
            throw new IllegalArgumentException("La visita ya no puede rechazarse");
        }

        visita.setEstado(EstadoVisitaHogar.RECHAZADA);
        visita.setRespuestaAnfitrion(limpiarTexto(request.mensaje()));

        VisitaHogar guardada = visitaRepository.save(visita);
        notificar(
                guardada,
                guardada.getAnfitrionId(),
                guardada.getInteresadoId(),
                "Visita rechazada",
                "El anfitrion rechazo la solicitud de visita para esta publicacion.");
        return guardada;
    }

    public VisitaHogar proponerAlternativa(Long visitaId, ProponerAlternativaVisitaRequest request) {
        VisitaHogar visita = buscarVisita(visitaId);
        validarId(request == null ? null : request.anfitrionId(), "El anfitrion es obligatorio");
        if (!visita.getAnfitrionId().equals(request.anfitrionId())) {
            throw new IllegalArgumentException("Solo el anfitrion puede proponer otro horario");
        }
        validarEstado(visita, EstadoVisitaHogar.PENDIENTE);
        if (request.fechaHoraAlternativa() == null || request.fechaHoraAlternativa().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La fecha alternativa debe ser futura");
        }

        visita.setEstado(EstadoVisitaHogar.PROPUESTA_ALTERNATIVA);
        visita.setFechaHoraAlternativa(request.fechaHoraAlternativa());
        visita.setMensajeAlternativa(limpiarTexto(request.mensaje()));

        VisitaHogar guardada = visitaRepository.save(visita);
        notificar(
                guardada,
                guardada.getAnfitrionId(),
                guardada.getInteresadoId(),
                "Nuevo horario propuesto",
                "El anfitrion propuso otro horario para la visita. Revisa y responde la propuesta.");
        return guardada;
    }

    public VisitaHogar responderAlternativa(Long visitaId, ResponderAlternativaVisitaRequest request) {
        VisitaHogar visita = buscarVisita(visitaId);
        validarId(request == null ? null : request.interesadoId(), "El interesado es obligatorio");
        if (!visita.getInteresadoId().equals(request.interesadoId())) {
            throw new IllegalArgumentException("Solo el interesado puede responder la alternativa");
        }
        validarEstado(visita, EstadoVisitaHogar.PROPUESTA_ALTERNATIVA);

        if (request.aceptada()) {
            visita.setEstado(EstadoVisitaHogar.ACEPTADA);
            visita.setFechaHoraPropuesta(visita.getFechaHoraAlternativa());
            visita.setRespuestaAnfitrion(limpiarTexto(request.mensaje()));
        } else {
            visita.setEstado(EstadoVisitaHogar.RECHAZADA);
            visita.setRespuestaAnfitrion(limpiarTexto(request.mensaje()));
        }

        VisitaHogar guardada = visitaRepository.save(visita);
        notificar(
                guardada,
                guardada.getInteresadoId(),
                guardada.getAnfitrionId(),
                request.aceptada() ? "Horario alternativo aceptado" : "Horario alternativo rechazado",
                request.aceptada()
                        ? "El interesado acepto el horario alternativo para la visita."
                        : "El interesado rechazo el horario alternativo para la visita.");
        return guardada;
    }

    public VisitaHogar cancelarVisita(Long visitaId, ResponderVisitaRequest request) {
        VisitaHogar visita = buscarVisita(visitaId);
        validarId(request == null ? null : request.usuarioId(), "El usuario es obligatorio");
        boolean puedeCancelar = visita.getInteresadoId().equals(request.usuarioId())
                || visita.getAnfitrionId().equals(request.usuarioId());
        if (!puedeCancelar) {
            throw new IllegalArgumentException("Solo los participantes pueden cancelar la visita");
        }
        if (visita.getEstado() == EstadoVisitaHogar.RECHAZADA || visita.getEstado() == EstadoVisitaHogar.CANCELADA) {
            throw new IllegalArgumentException("La visita ya esta cerrada");
        }

        visita.setEstado(EstadoVisitaHogar.CANCELADA);
        visita.setRespuestaAnfitrion(limpiarTexto(request.mensaje()));

        VisitaHogar guardada = visitaRepository.save(visita);
        Long receptor = request.usuarioId().equals(guardada.getInteresadoId())
                ? guardada.getAnfitrionId()
                : guardada.getInteresadoId();
        notificar(
                guardada,
                request.usuarioId(),
                receptor,
                "Visita cancelada",
                "La visita coordinada fue cancelada.");
        return guardada;
    }

    private void validarCreacion(CrearVisitaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de visita es obligatoria");
        }
        validarId(request.publicacionId(), "La publicacion es obligatoria");
        validarId(request.hogarId(), "El hogar es obligatorio");
        validarId(request.interesadoId(), "El interesado es obligatorio");
        validarId(request.anfitrionId(), "El anfitrion es obligatorio");
        if (request.fechaHoraPropuesta() == null || request.fechaHoraPropuesta().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La fecha de visita debe ser futura");
        }
    }

    private void validarRespuestaAnfitrion(VisitaHogar visita, ResponderVisitaRequest request) {
        validarId(request == null ? null : request.usuarioId(), "El anfitrion es obligatorio");
        if (!visita.getAnfitrionId().equals(request.usuarioId())) {
            throw new IllegalArgumentException("Solo el anfitrion puede responder la visita");
        }
    }

    private void validarEstado(VisitaHogar visita, EstadoVisitaHogar esperado) {
        if (visita.getEstado() != esperado) {
            throw new IllegalArgumentException("La visita no esta en estado " + esperado);
        }
    }

    private void validarAnfitrion(Hogar hogar, Long anfitrionId) {
        if (anfitrionId == null
                || (!anfitrionId.equals(hogar.getUsuarioAdministradorId())
                        && !anfitrionId.equals(hogar.getUsuarioCreadorId()))) {
            throw new IllegalArgumentException("El anfitrion debe administrar el hogar vinculado");
        }
    }

    private Hogar buscarHogar(Long hogarId) {
        validarId(hogarId, "El hogar es obligatorio");
        return hogarRepository.findById(hogarId)
                .orElseThrow(() -> new IllegalArgumentException("El hogar no existe"));
    }

    private VisitaHogar buscarVisita(Long visitaId) {
        validarId(visitaId, "La visita es obligatoria");
        return visitaRepository.findById(visitaId)
                .orElseThrow(() -> new IllegalArgumentException("La visita no existe"));
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

    private void notificar(VisitaHogar visita, Long emisorId, Long receptorId, String titulo, String mensaje) {
        try {
            Map<String, Object> payload = Map.of(
                    "usuarioEmisorId", emisorId,
                    "usuarioReceptorId", receptorId,
                    "hogarId", visita.getHogarId(),
                    "referenciaId", visita.getId(),
                    "tipo", "VISITA_HOGAR",
                    "estado", "PENDIENTE",
                    "titulo", titulo,
                    "mensaje", mensaje);
            restTemplate.postForEntity(notificacionServiceUrl + "/notificaciones", payload, Map.class);
        } catch (Exception e) {
            System.out.println("No se pudo crear notificacion de visita: " + e.getMessage());
        }
    }
}
