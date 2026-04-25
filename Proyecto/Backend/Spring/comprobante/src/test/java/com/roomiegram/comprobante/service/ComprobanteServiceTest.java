package com.roomiegram.comprobante.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.roomiegram.comprobante.model.Comprobante;
import com.roomiegram.comprobante.repository.ComprobanteRepository;

@ExtendWith(MockitoExtension.class)
class ComprobanteServiceTest {

    @Mock
    private ComprobanteRepository comprobanteRepository;

    @InjectMocks
    private ComprobanteService comprobanteService;

    @Test
    void crearComprobanteDebeGuardarConIdNulo() {
        Comprobante comprobante = crearComprobante(99L, "comprobante.pdf", "25000.00");

        when(comprobanteRepository.save(comprobante)).thenReturn(comprobante);

        Comprobante resultado = comprobanteService.crearComprobante(comprobante);

        assertNull(comprobante.getId());
        assertEquals(comprobante, resultado);
        verify(comprobanteRepository).save(comprobante);
    }

    @Test
    void actualizarComprobanteDebePersistirCambios() {
        Comprobante existente = crearComprobante(1L, "anterior.pdf", "15000.00");
        Comprobante actualizado = crearComprobante(null, "nuevo.pdf", "35000.00");

        when(comprobanteRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(comprobanteRepository.save(existente)).thenReturn(existente);

        Comprobante resultado = comprobanteService.actualizarComprobante(1L, actualizado);

        assertEquals("nuevo.pdf", resultado.getNombreArchivo());
        assertEquals(new BigDecimal("35000.00"), resultado.getMontoPagado());
        verify(comprobanteRepository).save(existente);
    }

    @Test
    void eliminarComprobanteDebeEliminarPorId() {
        comprobanteService.eliminarComprobante(1L);

        verify(comprobanteRepository).deleteById(1L);
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