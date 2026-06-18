package com.roomiegram.usuario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomiegram.usuario.DTO.TaskAssignmentEmailRequest;
import com.roomiegram.usuario.DTO.TaskCompletedEmailRequest;
import com.roomiegram.usuario.DTO.RequestReceivedEmailRequest;
import com.roomiegram.usuario.DTO.RequestResolvedEmailRequest;
import com.roomiegram.usuario.service.NotificationEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class NotificationEmailControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private NotificationEmailService notificationEmailService;

    @InjectMocks
    private NotificationEmailController notificationEmailController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationEmailController).build();
    }

    @Test
    void enviarCorreoTareaAsignadaDebeRetornar200CuandoSeEnvia() throws Exception {
        TaskAssignmentEmailRequest request = crearRequest();
        when(notificationEmailService.enviarCorreoTareaAsignada(request)).thenReturn(true);

        mockMvc.perform(post("/auth/emails/task-assignment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(true));
    }

    @Test
    void enviarCorreoTareaAsignadaDebeRetornar200CuandoSmtpFallaControlado() throws Exception {
        TaskAssignmentEmailRequest request = crearRequest();
        when(notificationEmailService.enviarCorreoTareaAsignada(request)).thenReturn(false);

        mockMvc.perform(post("/auth/emails/task-assignment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(false));
    }

    @Test
    void enviarCorreoTareaAsignadaDebeRetornar400ConSolicitudInvalida() throws Exception {
        TaskAssignmentEmailRequest request = crearRequest();
        when(notificationEmailService.enviarCorreoTareaAsignada(request))
                .thenThrow(new IllegalArgumentException("Usuario encargado no encontrado"));

        mockMvc.perform(post("/auth/emails/task-assignment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.enviado").value(false));
    }

    @Test
    void enviarCorreoSolicitudRecibidaDebeRetornar200CuandoSeEnvia() throws Exception {
        RequestReceivedEmailRequest request = crearSolicitudRequest();
        when(notificationEmailService.enviarCorreoSolicitudRecibida(request)).thenReturn(true);

        mockMvc.perform(post("/auth/emails/solicitud-recibida")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(true));
    }

    @Test
    void enviarCorreoSolicitudRecibidaDebeRetornar200CuandoSmtpFallaControlado() throws Exception {
        RequestReceivedEmailRequest request = crearSolicitudRequest();
        when(notificationEmailService.enviarCorreoSolicitudRecibida(request)).thenReturn(false);

        mockMvc.perform(post("/auth/emails/solicitud-recibida")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(false));
    }

    @Test
    void enviarCorreoSolicitudRecibidaDebeRetornar400ConSolicitudInvalida() throws Exception {
        RequestReceivedEmailRequest request = crearSolicitudRequest();
        when(notificationEmailService.enviarCorreoSolicitudRecibida(request))
                .thenThrow(new IllegalArgumentException("Usuario receptor no encontrado"));

        mockMvc.perform(post("/auth/emails/solicitud-recibida")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.enviado").value(false));
    }

    @Test
    void enviarCorreoSolicitudResueltaDebeRetornar200CuandoSeEnvia() throws Exception {
        RequestResolvedEmailRequest request = crearSolicitudResueltaRequest(true);
        when(notificationEmailService.enviarCorreoSolicitudResuelta(request)).thenReturn(true);

        mockMvc.perform(post("/auth/emails/solicitud-resuelta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(true));
    }

    @Test
    void enviarCorreoSolicitudResueltaDebeRetornar200CuandoSmtpFallaControlado() throws Exception {
        RequestResolvedEmailRequest request = crearSolicitudResueltaRequest(false);
        when(notificationEmailService.enviarCorreoSolicitudResuelta(request)).thenReturn(false);

        mockMvc.perform(post("/auth/emails/solicitud-resuelta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(false));
    }

    @Test
    void enviarCorreoTareaCompletadaDebeRetornar200CuandoSeEnvia() throws Exception {
        TaskCompletedEmailRequest request = crearTareaCompletadaRequest();
        when(notificationEmailService.enviarCorreoTareaCompletada(request)).thenReturn(true);

        mockMvc.perform(post("/auth/emails/task-completed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(true));
    }

    @Test
    void enviarCorreoTareaCompletadaDebeRetornar200CuandoSmtpFallaControlado() throws Exception {
        TaskCompletedEmailRequest request = crearTareaCompletadaRequest();
        when(notificationEmailService.enviarCorreoTareaCompletada(request)).thenReturn(false);

        mockMvc.perform(post("/auth/emails/task-completed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enviado").value(false));
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
}
