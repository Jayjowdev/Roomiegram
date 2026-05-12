package com.roomiegram.hogarcuenta.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.roomiegram.hogarcuenta.model.HogarCuenta;
import com.roomiegram.hogarcuenta.repository.HogarCuentaRepository;

@ExtendWith(MockitoExtension.class)
class HogarCuentaServiceTest {

    @Mock
    private HogarCuentaRepository hogarCuentaRepository;

    @InjectMocks
    private HogarCuentaService hogarCuentaService;

    @Test
    void guardarHogarCuentaDebeGuardarConDatosValidos() {
        HogarCuenta hogarCuenta = crearHogarCuenta(1L, "Cuenta de gas", "24000.00");
        when(hogarCuentaRepository.save(any(HogarCuenta.class))).thenReturn(hogarCuenta);

        HogarCuenta resultado = hogarCuentaService.guardarHogarCuenta(hogarCuenta);

        assertNotNull(resultado);
        assertEquals("Cuenta de gas", resultado.getDescripcion());
        verify(hogarCuentaRepository).save(hogarCuenta);
    }

    @Test
    void guardarHogarCuentaDebeFallarConDescripcionNula() {
        HogarCuenta hogarCuenta = new HogarCuenta();
        hogarCuenta.setDescripcion(null);
        hogarCuenta.setMonto(new BigDecimal("24000.00"));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarCuentaService.guardarHogarCuenta(hogarCuenta));

        assertEquals("La descripcion es obligatoria", exception.getMessage());
    }

    @Test
    void guardarHogarCuentaDebeFallarConDescripcionVacia() {
        HogarCuenta hogarCuenta = new HogarCuenta();
        hogarCuenta.setDescripcion("  ");
        hogarCuenta.setMonto(new BigDecimal("24000.00"));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarCuentaService.guardarHogarCuenta(hogarCuenta));

        assertEquals("La descripcion es obligatoria", exception.getMessage());
    }

    @Test
    void guardarHogarCuentaDebeFallarConMontoNulo() {
        HogarCuenta hogarCuenta = new HogarCuenta();
        hogarCuenta.setDescripcion("Cuenta de agua");
        hogarCuenta.setMonto(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarCuentaService.guardarHogarCuenta(hogarCuenta));

        assertEquals("El monto debe ser mayor a 0", exception.getMessage());
    }

    @Test
    void guardarHogarCuentaDebeFallarConMontoCero() {
        HogarCuenta hogarCuenta = new HogarCuenta();
        hogarCuenta.setDescripcion("Cuenta de luz");
        hogarCuenta.setMonto(BigDecimal.ZERO);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarCuentaService.guardarHogarCuenta(hogarCuenta));

        assertEquals("El monto debe ser mayor a 0", exception.getMessage());
    }

    @Test
    void obtenerTodasDebeRetornarListaDeHogarCuentas() {
        List<HogarCuenta> lista = List.of(
                crearHogarCuenta(1L, "Cuenta de gas", "24000.00"),
                crearHogarCuenta(2L, "Cuenta de luz", "18000.00"));
        when(hogarCuentaRepository.findAll()).thenReturn(lista);

        List<HogarCuenta> resultado = hogarCuentaService.obtenerTodas();

        assertEquals(2, resultado.size());
        verify(hogarCuentaRepository).findAll();
    }

    @Test
    void obtenerPorIdDebeRetornarHogarCuentaCuandoExiste() {
        HogarCuenta hogarCuenta = crearHogarCuenta(1L, "Cuenta de agua", "12000.00");
        when(hogarCuentaRepository.findById(1L)).thenReturn(Optional.of(hogarCuenta));

        Optional<HogarCuenta> resultado = hogarCuentaService.obtenerPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals("Cuenta de agua", resultado.get().getDescripcion());
    }

    @Test
    void obtenerPorIdDebeRetornarVacioCuandoNoExiste() {
        when(hogarCuentaRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<HogarCuenta> resultado = hogarCuentaService.obtenerPorId(99L);

        assertFalse(resultado.isPresent());
    }

    @Test
    void eliminarHogarCuentaDebeEliminarPorId() {
        hogarCuentaService.eliminarHogarCuenta(1L);

        verify(hogarCuentaRepository).deleteById(1L);
    }

    private HogarCuenta crearHogarCuenta(Long id, String descripcion, String monto) {
        HogarCuenta hogarCuenta = new HogarCuenta();
        hogarCuenta.setId(id);
        hogarCuenta.setDescripcion(descripcion);
        hogarCuenta.setMonto(new BigDecimal(monto));
        return hogarCuenta;
    }
}
