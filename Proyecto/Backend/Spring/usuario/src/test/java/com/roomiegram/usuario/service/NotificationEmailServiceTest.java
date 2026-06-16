package com.roomiegram.usuario.service;

import com.roomiegram.usuario.DTO.TaskAssignmentEmailRequest;
import com.roomiegram.usuario.DTO.TaskCompletedEmailRequest;
import com.roomiegram.usuario.DTO.RequestReceivedEmailRequest;
import com.roomiegram.usuario.DTO.RequestResolvedEmailRequest;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.RegisterRepository;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class NotificationEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private RegisterRepository registerRepository;

    @InjectMocks
    private NotificationEmailService notificationEmailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(notificationEmailService, "mailFrom", "no-reply@roomiegram.com");
    }

    @Test
    void enviarCorreoTareaAsignadaDebeEnviarCorreoAlEncargado() {
        Register encargado = crearRegister();
        when(registerRepository.findById(2L)).thenReturn(Optional.of(encargado));

        boolean enviado = notificationEmailService.enviarCorreoTareaAsignada(crearRequest());

        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(mailCaptor.capture());

        assertTrue(enviado);
        assertTrue(mailCaptor.getValue().getSubject().contains("Nueva tarea asignada"));
        assertTrue(mailCaptor.getValue().getText().contains("Limpiar cocina"));
    }

    @Test
    void enviarCorreoTareaAsignadaDebeRetornarFalseSiSmtpFalla() {
        Register encargado = crearRegister();
        when(registerRepository.findById(2L)).thenReturn(Optional.of(encargado));
        doThrow(new MailSendException("SMTP no disponible")).when(mailSender).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        boolean enviado = notificationEmailService.enviarCorreoTareaAsignada(crearRequest());

        assertFalse(enviado);
    }

    @Test
    void enviarCorreoTareaAsignadaDebeFallarSiUsuarioNoExiste() {
        when(registerRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> notificationEmailService.enviarCorreoTareaAsignada(crearRequest()));
    }

    @Test
    void enviarCorreoTareaCompletadaDebeEnviarCorreoAlResponsable() {
        Register receptor = crearAdmin();
        Register completador = crearRegister();
        when(registerRepository.findById(1L)).thenReturn(Optional.of(receptor));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(completador));

        boolean enviado = notificationEmailService.enviarCorreoTareaCompletada(crearTareaCompletadaRequest());

        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(mailCaptor.capture());

        assertTrue(enviado);
        assertTrue(mailCaptor.getValue().getSubject().contains("Tarea completada"));
        assertTrue(mailCaptor.getValue().getText().contains("completó la tarea \"Limpiar cocina\""));
        assertTrue(mailCaptor.getValue().getText().contains("Limpiar cocina"));
    }

    @Test
    void enviarCorreoTareaCompletadaDebeRetornarFalseSiSmtpFalla() {
        Register receptor = crearAdmin();
        Register completador = crearRegister();
        when(registerRepository.findById(1L)).thenReturn(Optional.of(receptor));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(completador));
        doThrow(new MailSendException("SMTP no disponible")).when(mailSender).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        boolean enviado = notificationEmailService.enviarCorreoTareaCompletada(crearTareaCompletadaRequest());

        assertFalse(enviado);
    }

    @Test
    void enviarCorreoSolicitudRecibidaDebeEnviarCorreoAlReceptor() {
        Register receptor = crearRegister();
        when(registerRepository.findById(2L)).thenReturn(Optional.of(receptor));

        boolean enviado = notificationEmailService.enviarCorreoSolicitudRecibida(crearSolicitudRequest());

        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(mailCaptor.capture());

        assertTrue(enviado);
        assertTrue(mailCaptor.getValue().getSubject().contains("Nueva solicitud"));
        assertTrue(mailCaptor.getValue().getText().contains("Franco"));
        assertTrue(mailCaptor.getValue().getText().contains("Hogar Central"));
    }

    @Test
    void enviarCorreoSolicitudRecibidaDebeRetornarFalseSiSmtpFalla() {
        Register receptor = crearRegister();
        when(registerRepository.findById(2L)).thenReturn(Optional.of(receptor));
        doThrow(new MailSendException("SMTP no disponible")).when(mailSender).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        boolean enviado = notificationEmailService.enviarCorreoSolicitudRecibida(crearSolicitudRequest());

        assertFalse(enviado);
    }

    @Test
    void enviarCorreoSolicitudResueltaDebeEnviarCorreoAlSolicitante() {
        Register solicitante = crearRegister();
        Register admin = crearAdmin();
        when(registerRepository.findById(3L)).thenReturn(Optional.of(solicitante));
        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));

        boolean enviado = notificationEmailService.enviarCorreoSolicitudResuelta(crearSolicitudResueltaRequest(true));

        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(mailCaptor.capture());

        assertTrue(enviado);
        assertTrue(mailCaptor.getValue().getSubject().contains("aceptada"));
        assertTrue(mailCaptor.getValue().getText().contains("Hogar Central"));
    }

    @Test
    void enviarCorreoSolicitudResueltaDebeRetornarFalseSiSmtpFalla() {
        Register solicitante = crearRegister();
        Register admin = crearAdmin();
        when(registerRepository.findById(3L)).thenReturn(Optional.of(solicitante));
        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        doThrow(new MailSendException("SMTP no disponible")).when(mailSender).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        boolean enviado = notificationEmailService.enviarCorreoSolicitudResuelta(crearSolicitudResueltaRequest(false));

        assertFalse(enviado);
    }

    @Test
    void enviarCorreoBienvenidaDebeRetornarFalseSiSmtpFalla() {
        Register usuario = crearRegister();
        doThrow(new MailSendException("SMTP no disponible")).when(mailSender).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        boolean enviado = notificationEmailService.enviarCorreoBienvenida(usuario);

        assertFalse(enviado);
    }

    private TaskAssignmentEmailRequest crearRequest() {
        return new TaskAssignmentEmailRequest(
                2L,
                "Limpiar cocina",
                "Ordenar y limpiar la cocina compartida",
                "2026-06-20",
                "Hogar Central",
                "Franco");
    }

    private RequestReceivedEmailRequest crearSolicitudRequest() {
        return new RequestReceivedEmailRequest(
                2L,
                3L,
                "Franco",
                "Hogar Central",
                "Habitacion disponible");
    }

    private RequestResolvedEmailRequest crearSolicitudResueltaRequest(boolean aceptada) {
        return new RequestResolvedEmailRequest(
                3L,
                1L,
                "Hogar Central",
                aceptada);
    }

    private TaskCompletedEmailRequest crearTareaCompletadaRequest() {
        return new TaskCompletedEmailRequest(
                1L,
                2L,
                "Limpiar cocina",
                "Ordenar y limpiar la cocina compartida",
                "2026-06-20",
                "Hogar Central");
    }

    private Register crearRegister() {
        Register register = new Register();
        register.setId(2L);
        register.setNombre("Maria");
        register.setUsuario("maria");
        register.setCorreo("maria@example.com");
        register.setTelefono("912345678");
        return register;
    }

    private Register crearAdmin() {
        Register register = new Register();
        register.setId(1L);
        register.setNombre("Admin");
        register.setUsuario("admin");
        register.setCorreo("admin@example.com");
        register.setTelefono("912345678");
        return register;
    }
}
