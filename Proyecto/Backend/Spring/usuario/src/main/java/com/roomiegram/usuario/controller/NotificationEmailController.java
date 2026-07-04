package com.roomiegram.usuario.controller;

import com.roomiegram.usuario.DTO.TaskAssignmentEmailRequest;
import com.roomiegram.usuario.DTO.TaskCompletedEmailRequest;
import com.roomiegram.usuario.DTO.RequestReceivedEmailRequest;
import com.roomiegram.usuario.DTO.RequestResolvedEmailRequest;
import com.roomiegram.usuario.DTO.SupportContactRequest;
import com.roomiegram.usuario.service.NotificationEmailService;
import com.roomiegram.usuario.DTO.VisitAlternativeEmailRequest;
import com.roomiegram.usuario.DTO.VisitAlternativeResolvedEmailRequest;
import com.roomiegram.usuario.DTO.VisitRequestedEmailRequest;
import com.roomiegram.usuario.DTO.VisitResolvedEmailRequest;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/emails")
public class NotificationEmailController {

    @Autowired
    private NotificationEmailService notificationEmailService;

    @PostMapping("/task-assignment")
    public ResponseEntity<?> enviarCorreoTareaAsignada(@RequestBody TaskAssignmentEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoTareaAsignada(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de tarea asignada enviado"
                            : "Tarea creada, pero no se pudo enviar el correo al encargado"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/solicitud-recibida")
    public ResponseEntity<?> enviarCorreoSolicitudRecibida(@RequestBody RequestReceivedEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoSolicitudRecibida(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de solicitud recibido enviado"
                            : "Solicitud creada, pero no se pudo enviar el correo al destinatario"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/solicitud-resuelta")
    public ResponseEntity<?> enviarCorreoSolicitudResuelta(@RequestBody RequestResolvedEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoSolicitudResuelta(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de resultado de solicitud enviado"
                            : "Solicitud actualizada, pero no se pudo enviar el correo al solicitante"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/task-completed")
    public ResponseEntity<?> enviarCorreoTareaCompletada(@RequestBody TaskCompletedEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoTareaCompletada(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de tarea completada enviado"
                            : "Tarea completada, pero no se pudo enviar el correo al responsable"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/visita-solicitada")
    public ResponseEntity<?> enviarCorreoVisitaSolicitada(@RequestBody VisitRequestedEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoVisitaSolicitada(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de visita solicitada enviado"
                            : "Visita solicitada, pero no se pudo enviar el correo al anfitrion"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/visita-resuelta")
    public ResponseEntity<?> enviarCorreoVisitaResuelta(@RequestBody VisitResolvedEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoVisitaResuelta(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de respuesta de visita enviado"
                            : "Visita actualizada, pero no se pudo enviar el correo al interesado"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/visita-alternativa")
    public ResponseEntity<?> enviarCorreoVisitaAlternativa(@RequestBody VisitAlternativeEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoVisitaAlternativa(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de horario alternativo enviado"
                            : "Horario alternativo propuesto, pero no se pudo enviar el correo"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/visita-alternativa-resuelta")
    public ResponseEntity<?> enviarCorreoVisitaAlternativaResuelta(@RequestBody VisitAlternativeResolvedEmailRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarCorreoVisitaAlternativaResuelta(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Correo de respuesta al horario alternativo enviado"
                            : "Respuesta registrada, pero no se pudo enviar el correo"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/support")
    public ResponseEntity<?> enviarContactoSoporte(@RequestBody SupportContactRequest request) {
        try {
            boolean enviado = notificationEmailService.enviarContactoSoporte(request);

            return ResponseEntity.ok(Map.of(
                    "enviado", enviado,
                    "mensaje", enviado
                            ? "Mensaje enviado al equipo de soporte"
                            : "No se pudo enviar el mensaje de soporte. Intenta nuevamente mas tarde"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "enviado", false,
                    "mensaje", e.getMessage()
            ));
        }
    }
}
