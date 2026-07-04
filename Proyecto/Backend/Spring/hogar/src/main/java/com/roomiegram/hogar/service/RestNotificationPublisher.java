package com.roomiegram.hogar.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.roomiegram.hogar.model.EstadoVisita;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.model.Visita;

@Component
public class RestNotificationPublisher implements NotificationPublisher {

    private static final String TIPO_INVITACION_HOGAR = "INVITACION_HOGAR";
    private static final String TIPO_VISITA_HOGAR = "VISITA_HOGAR";
    private static final String ESTADO_PENDIENTE = "PENDIENTE";
    private static final String ESTADO_ACEPTADA = "ACEPTADA";
    private static final String ESTADO_RECHAZADA = "RECHAZADA";

    private final RestClient restClient;

    public RestNotificationPublisher(
            RestClient.Builder restClientBuilder,
            @Value("${services.notificacion.url:http://localhost:8085}") String notificacionServiceUrl) {
        this.restClient = restClientBuilder.baseUrl(notificacionServiceUrl).build();
    }

    @Override
    public void publicarSolicitudIngreso(Hogar hogar, Long usuarioSolicitanteId) {
        Long usuarioReceptorId = hogar.getUsuarioAdministradorId() != null
                ? hogar.getUsuarioAdministradorId()
                : hogar.getUsuarioCreadorId();

        if (usuarioReceptorId == null) {
            throw new IllegalStateException("El hogar no tiene un administrador asignado para notificar");
        }

        NotificationRequest payload = new NotificationRequest(
                usuarioSolicitanteId,
                usuarioReceptorId,
                hogar.getId(),
                usuarioSolicitanteId,
                TIPO_INVITACION_HOGAR,
                ESTADO_PENDIENTE,
                "Solicitud de ingreso pendiente",
                "El usuario " + usuarioSolicitanteId + " solicito ingresar al hogar " + hogar.getNombre() + ".");

        restClient.post()
                .uri("/notificaciones")
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    @Override
    public void publicarNuevaVisita(Hogar hogar, Visita visita) {
        Long usuarioReceptorId = hogar.getUsuarioAdministradorId() != null
                ? hogar.getUsuarioAdministradorId()
                : hogar.getUsuarioCreadorId();

        if (usuarioReceptorId == null) {
            throw new IllegalStateException("El hogar no tiene un administrador asignado para notificar");
        }

        NotificationRequest payload = new NotificationRequest(
                visita.getUsuarioVisitanteId(),
                usuarioReceptorId,
                hogar.getId(),
                visita.getId(),
                TIPO_VISITA_HOGAR,
                ESTADO_PENDIENTE,
                "Nueva visita programada",
                "El usuario " + visita.getUsuarioVisitanteId() + " agendo una visita para el hogar "
                        + hogar.getNombre() + " el " + visita.getFechaVisita() + ".");

        restClient.post()
                .uri("/notificaciones")
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    @Override
    public void publicarVisitaActualizada(Hogar hogar, Visita visita) {
        String estadoNotificacion = EstadoVisita.REALIZADA.equals(visita.getEstado()) ? ESTADO_ACEPTADA
                : EstadoVisita.CANCELADA.equals(visita.getEstado()) ? ESTADO_RECHAZADA : ESTADO_PENDIENTE;
        String titulo = EstadoVisita.REALIZADA.equals(visita.getEstado()) ? "Visita realizada"
                : EstadoVisita.CANCELADA.equals(visita.getEstado()) ? "Visita cancelada" : "Visita actualizada";
        String mensaje = EstadoVisita.REALIZADA.equals(visita.getEstado())
                ? "La visita al hogar " + hogar.getNombre() + " fue marcada como realizada. Ya puedes enviar tu solicitud de ingreso."
                : "La visita al hogar " + hogar.getNombre() + " fue " + visita.getEstado().name().toLowerCase() + ".";

        NotificationRequest payload = new NotificationRequest(
                hogar.getUsuarioAdministradorId(),
                visita.getUsuarioVisitanteId(),
                hogar.getId(),
                visita.getId(),
                TIPO_VISITA_HOGAR,
                estadoNotificacion,
                titulo,
                mensaje);

        restClient.post()
                .uri("/notificaciones")
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    private record NotificationRequest(
            Long usuarioEmisorId,
            Long usuarioReceptorId,
            Long hogarId,
            Long referenciaId,
            String tipo,
            String estado,
            String titulo,
            String mensaje) {
    }
}