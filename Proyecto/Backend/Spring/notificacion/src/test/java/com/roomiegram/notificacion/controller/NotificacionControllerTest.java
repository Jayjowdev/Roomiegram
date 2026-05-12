package com.roomiegram.notificacion.controller;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomiegram.notificacion.enums.TipoNotificacion;
import com.roomiegram.notificacion.model.Notificacion;
import com.roomiegram.notificacion.service.NotificacionService;

@ExtendWith(MockitoExtension.class)
class NotificacionControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private NotificacionController notificacionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificacionController).build();
    }

    @Test
    void crearDebeRetornar201() throws Exception {
        Notificacion request = crearNotificacion(null);
        Notificacion response = crearNotificacion(1L);
        when(notificacionService.guardarNotificacion(any(Notificacion.class))).thenReturn(response);

        mockMvc.perform(post("/notificaciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.titulo").value("Solicitud de ingreso"));
    }

    @Test
    void obtenerTodasDebeRetornar200() throws Exception {
        when(notificacionService.obtenerTodas()).thenReturn(List.of(
                crearNotificacion(1L),
                crearNotificacion(2L)));

        mockMvc.perform(get("/notificaciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void obtenerPorIdDebeRetornar200() throws Exception {
        Notificacion notificacion = crearNotificacion(1L);
        when(notificacionService.obtenerPorId(1L)).thenReturn(Optional.of(notificacion));

        mockMvc.perform(get("/notificaciones/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.titulo").value("Solicitud de ingreso"));
    }

    @Test
    void obtenerPorIdDebeRetornar404CuandoNoExiste() throws Exception {
        when(notificacionService.obtenerPorId(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/notificaciones/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void eliminarDebeRetornar204() throws Exception {
        when(notificacionService.obtenerPorId(1L)).thenReturn(Optional.of(crearNotificacion(1L)));
        doNothing().when(notificacionService).eliminarNotificacion(1L);

        mockMvc.perform(delete("/notificaciones/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void eliminarDebeRetornar404CuandoNoExiste() throws Exception {
        when(notificacionService.obtenerPorId(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/notificaciones/99"))
                .andExpect(status().isNotFound());
    }

    private Notificacion crearNotificacion(Long id) {
        Notificacion notificacion = new Notificacion();
        notificacion.setId(id);
        notificacion.setUsuarioEmisorId(1L);
        notificacion.setUsuarioReceptorId(2L);
        notificacion.setHogarId(10L);
        notificacion.setTipo(TipoNotificacion.INVITACION_HOGAR);
        notificacion.setTitulo("Solicitud de ingreso");
        notificacion.setMensaje("El usuario 1 solicita unirse al hogar");
        return notificacion;
    }
}
