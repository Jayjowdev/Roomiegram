package com.roomiegram.tarea.controller;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.roomiegram.tarea.model.Tarea;
import com.roomiegram.tarea.service.TareaService;

@ExtendWith(MockitoExtension.class)
class TareaControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Mock
    private TareaService tareaService;

    @InjectMocks
    private TareaController tareaController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tareaController).build();
    }

    @Test
    void guardarDebeRetornar201() throws Exception {
        Tarea request = crearTarea();
        when(tareaService.guardarTarea(any(Tarea.class))).thenReturn(request);

        mockMvc.perform(post("/tareas/guardar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Limpiar cocina"))
                .andExpect(jsonPath("$.encargado").value("juan"))
                .andExpect(jsonPath("$.completada").value(false));
    }

    @Test
    void listarDebeRetornar200() throws Exception {
        List<Tarea> tareas = List.of(crearTarea(), crearTarea());
        when(tareaService.listarTareas()).thenReturn(tareas);

        mockMvc.perform(get("/tareas/listar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titulo").value("Limpiar cocina"))
                .andExpect(jsonPath("$[1].titulo").value("Limpiar cocina"));
    }

    @Test
    void listarDebeRetornarListaVacia() throws Exception {
        when(tareaService.listarTareas()).thenReturn(List.of());

        mockMvc.perform(get("/tareas/listar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void actualizarDebeRetornar200() throws Exception {
        Tarea request = crearTarea();
        request.setTitulo("Limpiar living");
        request.setEncargado("maria");
        request.setDescripcion("Ordenar el living del hogar");
        request.setFecha(LocalDate.of(2026, 5, 21));

        when(tareaService.actualizarTarea(eq(1L), any(Tarea.class))).thenReturn(request);

        mockMvc.perform(put("/tareas/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Limpiar living"))
                .andExpect(jsonPath("$.encargado").value("maria"))
                .andExpect(jsonPath("$.descripcion").value("Ordenar el living del hogar"))
                .andExpect(jsonPath("$.fecha").value("2026-05-21"))
                .andExpect(jsonPath("$.completada").value(false));
    }

    @Test
    void completarDebeRetornar200() throws Exception {
        Tarea request = crearTarea();
        request.setCompletada(true);

        when(tareaService.cambiarEstadoTarea(1L, true)).thenReturn(request);

        mockMvc.perform(patch("/tareas/1/completar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.completada").value(true));
    }

    @Test
    void pendienteDebeRetornar200() throws Exception {
        Tarea request = crearTarea();
        request.setCompletada(false);

        when(tareaService.cambiarEstadoTarea(1L, false)).thenReturn(request);

        mockMvc.perform(patch("/tareas/1/pendiente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.completada").value(false));
    }

    private Tarea crearTarea() {
        Tarea tarea = new Tarea();
        tarea.setId(1L);
        tarea.setTitulo("Limpiar cocina");
        tarea.setEncargado("juan");
        tarea.setDescripcion("Limpiar la cocina del hogar");
        tarea.setFecha(LocalDate.of(2026, 5, 20));
        tarea.setCompletada(false);
        return tarea;
    }
}
