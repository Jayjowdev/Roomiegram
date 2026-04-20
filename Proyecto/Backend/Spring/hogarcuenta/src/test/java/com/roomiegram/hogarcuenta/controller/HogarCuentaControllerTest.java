package com.roomiegram.hogarcuenta.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import com.roomiegram.hogarcuenta.model.HogarCuenta;
import com.roomiegram.hogarcuenta.service.HogarCuentaService;

@ExtendWith(MockitoExtension.class)
class HogarCuentaControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private HogarCuentaService hogarCuentaService;

    @InjectMocks
    private HogarCuentaController hogarCuentaController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(hogarCuentaController).build();
    }

    @Test
    void crearDebeRetornar201() throws Exception {
        HogarCuenta request = crearHogarCuenta(1L, "Cuenta de gas", "24000.00");
        HogarCuenta response = crearHogarCuenta(1L, "Cuenta de gas", "24000.00");

        when(hogarCuentaService.guardarHogarCuenta(org.mockito.ArgumentMatchers.any(HogarCuenta.class))).thenReturn(response);

        mockMvc.perform(post("/hogar-cuentas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.descripcion").value("Cuenta de gas"))
                .andExpect(jsonPath("$.monto").value(24000.00));
    }

    @Test
    void obtenerTodasDebeRetornar200() throws Exception {
        when(hogarCuentaService.obtenerTodas()).thenReturn(List.of(
                crearHogarCuenta(1L, "Cuenta de gas", "24000.00"),
                crearHogarCuenta(2L, "Cuenta de luz", "18000.00")));

        mockMvc.perform(get("/hogar-cuentas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion").value("Cuenta de gas"))
                .andExpect(jsonPath("$[1].descripcion").value("Cuenta de luz"));
    }

    @Test
    void obtenerPorIdDebeRetornar200() throws Exception {
        when(hogarCuentaService.obtenerPorId(1L)).thenReturn(Optional.of(
                crearHogarCuenta(1L, "Cuenta de agua", "12000.00")));

        mockMvc.perform(get("/hogar-cuentas/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcion").value("Cuenta de agua"))
                .andExpect(jsonPath("$.monto").value(12000.00));
    }

    @Test
    void eliminarDebeRetornar204() throws Exception {
        when(hogarCuentaService.obtenerPorId(1L)).thenReturn(Optional.of(
                crearHogarCuenta(1L, "Cuenta de internet", "36000.00")));
        doNothing().when(hogarCuentaService).eliminarHogarCuenta(1L);

        mockMvc.perform(delete("/hogar-cuentas/1"))
                .andExpect(status().isNoContent());
    }

    private HogarCuenta crearHogarCuenta(Long id, String descripcion, String monto) {
        HogarCuenta hogarCuenta = new HogarCuenta();
        hogarCuenta.setId(id);
        hogarCuenta.setDescripcion(descripcion);
        hogarCuenta.setMonto(new BigDecimal(monto));
        return hogarCuenta;
    }
}