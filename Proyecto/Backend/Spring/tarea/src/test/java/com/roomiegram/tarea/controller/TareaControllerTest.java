package com.roomiegram.tarea.controller;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
                .andExpect(jsonPath("$.encargado").value("juan"));
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

    private Tarea crearTarea() {
        Tarea tarea = new Tarea();
        tarea.setId(1L);
        tarea.setTitulo("Limpiar cocina");
        tarea.setEncargado("juan");
        tarea.setDescripcion("Limpiar la cocina del hogar");
        tarea.setFecha(LocalDate.of(2026, 5, 20));
        return tarea;
    }
}
