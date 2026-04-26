package com.roomiegram.hogar.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import com.roomiegram.hogar.dto.AdminActionRequest;
import com.roomiegram.hogar.dto.CreateHogarRequest;
import com.roomiegram.hogar.dto.UsuarioRequest;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.service.HogarService;

@ExtendWith(MockitoExtension.class)
class HogarControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private HogarService hogarService;

    @InjectMocks
    private HogarController hogarController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(hogarController).build();
    }

    @Test
    void crearHogarDebeRetornar201() throws Exception {
        CreateHogarRequest request = new CreateHogarRequest("Hogar Centro", "Depto amoblado", 1L);
        when(hogarService.crearHogar(any(CreateHogarRequest.class))).thenReturn(crearHogar());

        mockMvc.perform(post("/hogares")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Hogar Centro"))
                .andExpect(jsonPath("$.usuarioAdministradorId").value(1));
    }

    @Test
    void obtenerPorIdDebeRetornar404CuandoNoExiste() throws Exception {
        when(hogarService.obtenerPorId(99L)).thenThrow(new IllegalArgumentException("El hogar no existe"));

        mockMvc.perform(get("/hogares/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void aprobarSolicitudDebeRetornar200() throws Exception {
        Hogar hogar = crearHogar();
        hogar.getIntegrantesIds().add(2L);
        when(hogarService.aprobarSolicitud(eq(1L), eq(2L), any(AdminActionRequest.class))).thenReturn(hogar);

        mockMvc.perform(post("/hogares/1/solicitudes/2/aprobar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminActionRequest(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.integrantesIds[0]").value(1))
                .andExpect(jsonPath("$.integrantesIds[1]").value(2));
    }

    @Test
    void eliminarHogarDebeRetornar204() throws Exception {
        doNothing().when(hogarService).eliminarHogar(1L, 1L);

        mockMvc.perform(delete("/hogares/1")
                        .param("administradorId", "1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void solicitarIngresoDebeRetornar400CuandoServiceFalla() throws Exception {
        when(hogarService.solicitarIngreso(eq(1L), any(UsuarioRequest.class)))
                .thenThrow(new IllegalArgumentException("La solicitud no se pudo registrar"));

        mockMvc.perform(post("/hogares/1/solicitudes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UsuarioRequest(3L))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$").value("La solicitud no se pudo registrar"));
    }

    private Hogar crearHogar() {
        Hogar hogar = new Hogar();
        hogar.setId(1L);
        hogar.setNombre("Hogar Centro");
        hogar.setDescripcion("Depto amoblado");
        hogar.setUsuarioCreadorId(1L);
        hogar.setUsuarioAdministradorId(1L);
        hogar.setActivo(true);
        hogar.getIntegrantesIds().add(1L);
        return hogar;
    }
}