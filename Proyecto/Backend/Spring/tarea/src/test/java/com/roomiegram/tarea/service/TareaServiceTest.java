package com.roomiegram.tarea.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.roomiegram.tarea.model.Tarea;
import com.roomiegram.tarea.repository.TareaRepository;

@ExtendWith(MockitoExtension.class)
class TareaServiceTest {

    @Mock
    private TareaRepository tareaRepository;

    @InjectMocks
    private TareaService tareaService;

    @Test
    void guardarTareaDebeGuardarConDatosValidos() {
        Tarea tarea = crearTarea();
        when(tareaRepository.save(any(Tarea.class))).thenReturn(tarea);

        Tarea resultado = tareaService.guardarTarea(tarea);

        assertNotNull(resultado);
        assertEquals("Limpiar cocina", resultado.getTitulo());
        verify(tareaRepository).save(tarea);
    }

    @Test
    void guardarTareaDebeFallarConTituloNulo() {
        Tarea tarea = crearTarea();
        tarea.setTitulo(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tareaService.guardarTarea(tarea));

        assertEquals("El título de la tarea no puede estar vacío", exception.getMessage());
    }

    @Test
    void guardarTareaDebeFallarConTituloVacio() {
        Tarea tarea = crearTarea();
        tarea.setTitulo("");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tareaService.guardarTarea(tarea));

        assertEquals("El título de la tarea no puede estar vacío", exception.getMessage());
    }

    @Test
    void guardarTareaDebeFallarConEncargadoNulo() {
        Tarea tarea = crearTarea();
        tarea.setEncargado(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tareaService.guardarTarea(tarea));

        assertEquals("El encargado de la tarea no puede estar vacío", exception.getMessage());
    }

    @Test
    void guardarTareaDebeFallarConDescripcionVacia() {
        Tarea tarea = crearTarea();
        tarea.setDescripcion("");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tareaService.guardarTarea(tarea));

        assertEquals("La descripción de la tarea no puede estar vacía", exception.getMessage());
    }

    @Test
    void guardarTareaDebeFallarConFechaNula() {
        Tarea tarea = crearTarea();
        tarea.setFecha(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tareaService.guardarTarea(tarea));

        assertEquals("La fecha de la tarea no puede estar vacía", exception.getMessage());
    }

    @Test
    void listarTareasDebeRetornarListaDeTareas() {
        List<Tarea> lista = List.of(crearTarea(), crearTarea());
        when(tareaRepository.findAll()).thenReturn(lista);

        List<Tarea> resultado = tareaService.listarTareas();

        assertEquals(2, resultado.size());
        verify(tareaRepository).findAll();
    }

    @Test
    void listarTareasDebeRetornarListaVacia() {
        when(tareaRepository.findAll()).thenReturn(List.of());

        List<Tarea> resultado = tareaService.listarTareas();

        assertEquals(0, resultado.size());
    }

    @Test
    void actualizarTareaDebeActualizarCamposPermitidos() {
        Tarea existente = crearTarea();
        Tarea cambios = crearTarea();
        cambios.setTitulo("Limpiar living");
        cambios.setEncargado("maria");
        cambios.setDescripcion("Ordenar el living del hogar");
        cambios.setFecha(LocalDate.of(2026, 5, 21));

        when(tareaRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(tareaRepository.save(existente)).thenReturn(existente);

        Tarea resultado = tareaService.actualizarTarea(1L, cambios);

        assertEquals(1L, resultado.getId());
        assertEquals("Limpiar living", resultado.getTitulo());
        assertEquals("maria", resultado.getEncargado());
        assertEquals("Ordenar el living del hogar", resultado.getDescripcion());
        assertEquals(LocalDate.of(2026, 5, 21), resultado.getFecha());
        verify(tareaRepository).findById(1L);
        verify(tareaRepository).save(existente);
    }

    @Test
    void actualizarTareaDebeFallarSiNoExiste() {
        when(tareaRepository.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tareaService.actualizarTarea(99L, crearTarea()));

        assertEquals("La tarea no existe", exception.getMessage());
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
