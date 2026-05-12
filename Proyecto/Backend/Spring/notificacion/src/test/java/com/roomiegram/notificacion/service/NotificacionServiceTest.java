package com.roomiegram.notificacion.service;

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

import com.roomiegram.notificacion.enums.TipoNotificacion;
import com.roomiegram.notificacion.model.Notificacion;
import com.roomiegram.notificacion.repository.NotificacionRepository;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock
    private NotificacionRepository notificacionRepository;

    @InjectMocks
    private NotificacionService notificacionService;

    @Test
    void guardarNotificacionDebeGuardarConDatosValidos() {
        Notificacion notificacion = crearNotificacion();
        when(notificacionRepository.save(any(Notificacion.class))).thenReturn(notificacion);

        Notificacion resultado = notificacionService.guardarNotificacion(notificacion);

        assertNotNull(resultado);
        assertNotNull(notificacion.getFechaActualizacion());
        assertEquals("Solicitud de ingreso", resultado.getTitulo());
        verify(notificacionRepository).save(notificacion);
    }

    @Test
    void guardarNotificacionDebeFallarSinUsuarioEmisor() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setUsuarioEmisorId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> notificacionService.guardarNotificacion(notificacion));

        assertEquals("El usuario emisor es obligatorio", exception.getMessage());
    }

    @Test
    void guardarNotificacionDebeFallarSinUsuarioReceptor() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setUsuarioReceptorId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> notificacionService.guardarNotificacion(notificacion));

        assertEquals("El usuario receptor es obligatorio", exception.getMessage());
    }

    @Test
    void guardarNotificacionDebeFallarSinHogar() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setHogarId(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> notificacionService.guardarNotificacion(notificacion));

        assertEquals("El hogar es obligatorio", exception.getMessage());
    }

    @Test
    void guardarNotificacionDebeFallarSinTipo() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setTipo(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> notificacionService.guardarNotificacion(notificacion));

        assertEquals("El tipo de notificacion es obligatorio", exception.getMessage());
    }

    @Test
    void guardarNotificacionDebeFallarConTituloVacio() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setTitulo("  ");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> notificacionService.guardarNotificacion(notificacion));

        assertEquals("El titulo es obligatorio", exception.getMessage());
    }

    @Test
    void guardarNotificacionDebeFallarConMensajeVacio() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setMensaje(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> notificacionService.guardarNotificacion(notificacion));

        assertEquals("El mensaje es obligatorio", exception.getMessage());
    }

    @Test
    void obtenerTodasDebeRetornarListaDeNotificaciones() {
        List<Notificacion> lista = List.of(crearNotificacion(), crearNotificacion());
        when(notificacionRepository.findAll()).thenReturn(lista);

        List<Notificacion> resultado = notificacionService.obtenerTodas();

        assertEquals(2, resultado.size());
        verify(notificacionRepository).findAll();
    }

    @Test
    void obtenerPorIdDebeRetornarNotificacionCuandoExiste() {
        Notificacion notificacion = crearNotificacion();
        notificacion.setId(1L);
        when(notificacionRepository.findById(1L)).thenReturn(Optional.of(notificacion));

        Optional<Notificacion> resultado = notificacionService.obtenerPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals("Solicitud de ingreso", resultado.get().getTitulo());
    }

    @Test
    void obtenerPorIdDebeRetornarVacioCuandoNoExiste() {
        when(notificacionRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Notificacion> resultado = notificacionService.obtenerPorId(99L);

        assertFalse(resultado.isPresent());
    }

    @Test
    void eliminarNotificacionDebeEliminarPorId() {
        notificacionService.eliminarNotificacion(1L);

        verify(notificacionRepository).deleteById(1L);
    }

    private Notificacion crearNotificacion() {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuarioEmisorId(1L);
        notificacion.setUsuarioReceptorId(2L);
        notificacion.setHogarId(10L);
        notificacion.setTipo(TipoNotificacion.INVITACION_HOGAR);
        notificacion.setTitulo("Solicitud de ingreso");
        notificacion.setMensaje("El usuario 1 solicita unirse al hogar");
        return notificacion;
    }
}
