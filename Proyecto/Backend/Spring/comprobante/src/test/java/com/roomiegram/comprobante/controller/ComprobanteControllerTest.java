package com.roomiegram.comprobante.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomiegram.comprobante.model.Comprobante;
import com.roomiegram.comprobante.service.ComprobanteService;

@ExtendWith(MockitoExtension.class)
class ComprobanteControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private ComprobanteService comprobanteService;

    @InjectMocks
    private ComprobanteController comprobanteController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(comprobanteController).build();
    }

    @Test
    void crearDebeRetornar201() throws Exception {
        Comprobante request = crearComprobante(null, "comprobante.pdf", "25000.00");
        Comprobante response = crearComprobante(1L, "comprobante.pdf", "25000.00");

        when(comprobanteService.crearComprobante(any(Comprobante.class))).thenReturn(response);

        mockMvc.perform(post("/comprobantes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombreArchivo").value("comprobante.pdf"))
                .andExpect(jsonPath("$.montoPagado").value(25000.00));
    }

    @Test
    void actualizarDebeRetornar200() throws Exception {
        Comprobante request = crearComprobante(null, "comprobante-actualizado.pdf", "30000.00");
        Comprobante response = crearComprobante(1L, "comprobante-actualizado.pdf", "30000.00");

        when(comprobanteService.obtenerPorId(1L)).thenReturn(Optional.of(crearComprobante(1L, "comprobante.pdf", "25000.00")));
        when(comprobanteService.actualizarComprobante(org.mockito.ArgumentMatchers.eq(1L), any(Comprobante.class)))
                .thenReturn(response);

        mockMvc.perform(put("/comprobantes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombreArchivo").value("comprobante-actualizado.pdf"))
                .andExpect(jsonPath("$.montoPagado").value(30000.00));
    }

    @Test
    void eliminarDebeRetornar204() throws Exception {
        when(comprobanteService.obtenerPorId(1L)).thenReturn(Optional.of(crearComprobante(1L, "comprobante.pdf", "25000.00")));
        doNothing().when(comprobanteService).eliminarComprobante(1L);

        mockMvc.perform(delete("/comprobantes/1"))
                .andExpect(status().isNoContent());
    }

    private Comprobante crearComprobante(Long id, String nombreArchivo, String montoPagado) {
        Comprobante comprobante = new Comprobante();
        comprobante.setId(id);
        comprobante.setHogarCuentaId(10L);
        comprobante.setUsuarioId(20L);
        comprobante.setNombreArchivo(nombreArchivo);
        comprobante.setTipoContenido("application/pdf");
        comprobante.setTamanoArchivo(2048L);
        comprobante.setMontoPagado(new BigDecimal(montoPagado));
        comprobante.setObservacion("Comprobante de prueba");
        comprobante.setFechaSubida(LocalDateTime.of(2026, 4, 25, 10, 30));
        comprobante.setArchivo("archivo".getBytes());
        return comprobante;
    }
}