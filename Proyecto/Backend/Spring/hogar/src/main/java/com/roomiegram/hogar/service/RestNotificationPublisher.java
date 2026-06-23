package com.roomiegram.hogar.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.roomiegram.hogar.model.Hogar;

@Component
public class RestNotificationPublisher implements NotificationPublisher {

    private static final String TIPO_INVITACION_HOGAR = "INVITACION_HOGAR";
    private static final String ESTADO_PENDIENTE = "PENDIENTE";

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