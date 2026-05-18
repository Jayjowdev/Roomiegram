package com.roomiegram.publicacion.controller;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
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
import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.service.PublicacionService;

@ExtendWith(MockitoExtension.class)
class PublicacionControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PublicacionService publicacionService;

    @InjectMocks
    private PublicacionController publicacionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(publicacionController).build();
    }

    @Test
    void guardarDebeRetornar201() throws Exception {
        Publicacion request = crearPublicacion();
        when(publicacionService.guardarPublicacion(any(Publicacion.class))).thenReturn(request);

        mockMvc.perform(post("/publicaciones/guardar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Habitacion amoblada"))
                .andExpect(jsonPath("$.usuarioCreador").value("juan"))
                .andExpect(jsonPath("$.precio").value(250000.0));
    }

    @Test
    void guardarDebeRetornar400CuandoServiceFalla() throws Exception {
        when(publicacionService.guardarPublicacion(any(Publicacion.class)))
                .thenThrow(new IllegalArgumentException("El título no puede estar vacío"));

        mockMvc.perform(post("/publicaciones/guardar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Publicacion())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarDebeRetornar200() throws Exception {
        when(publicacionService.listarPublicaciones()).thenReturn(List.of(crearPublicacion()));

        mockMvc.perform(get("/publicaciones/listar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titulo").value("Habitacion amoblada"))
                .andExpect(jsonPath("$[0].usuarioCreador").value("juan"));
    }

    @Test
    void listarDebeRetornarListaVacia() throws Exception {
        when(publicacionService.listarPublicaciones()).thenReturn(List.of());

        mockMvc.perform(get("/publicaciones/listar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void eliminarDebeRetornar200() throws Exception {
        doNothing().when(publicacionService).eliminarPublicacion(eq(1L), eq("juan"), eq("CLIENTE"));

        mockMvc.perform(delete("/publicaciones/1")
                        .param("usuarioSolicitante", "juan")
                        .param("rolSolicitante", "CLIENTE"))
                .andExpect(status().isOk());
    }

    @Test
    void eliminarDebeRetornar403CuandoNoTienePermisos() throws Exception {
        doThrow(new SecurityException("No tienes permisos para eliminar esta publicación"))
                .when(publicacionService).eliminarPublicacion(eq(1L), eq("pedro"), eq("CLIENTE"));

        mockMvc.perform(delete("/publicaciones/1")
                        .param("usuarioSolicitante", "pedro")
                        .param("rolSolicitante", "CLIENTE"))
                .andExpect(status().isForbidden());
    }

    @Test
    void eliminarDebeRetornar400CuandoPublicacionNoExiste() throws Exception {
        doThrow(new IllegalArgumentException("La publicación no existe"))
            .when(publicacionService).eliminarPublicacion(eq(99L), eq("juan"), eq("CLIENTE"));

        mockMvc.perform(delete("/publicaciones/99")
                .param("usuarioSolicitante", "juan")
                .param("rolSolicitante", "CLIENTE"))
                .andExpect(status().isBadRequest());
    }

    private Publicacion crearPublicacion() {
        Publicacion publicacion = new Publicacion();
        publicacion.setId(1L);
        publicacion.setUsuarioCreador("juan");
        publicacion.setTitulo("Habitacion amoblada");
        publicacion.setUbicacion("Santiago Centro");
        publicacion.setDescripcion("Habitacion cerca del metro");
        publicacion.setPrecio(250000.0);
        publicacion.setNumeroHabitaciones(2);
        publicacion.setNumeroPersonas(1);
        publicacion.setNumeroBanos(1);
        return publicacion;
    }
}
