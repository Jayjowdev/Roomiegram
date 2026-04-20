package com.roomiegram.publicacion.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.repository.PublicacionRepository;

@ExtendWith(MockitoExtension.class)
class PublicacionServiceTest {

    @Mock
    private PublicacionRepository publicacionRepository;

    @InjectMocks
    private PublicacionService publicacionService;

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

    @Test
    void eliminaPublicacionCuandoUsuarioEsPropietario() {
        Publicacion publicacion = crearPublicacion();
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));

        assertDoesNotThrow(() -> publicacionService.eliminarPublicacion(1L, "juan", "CLIENTE"));

        verify(publicacionRepository).delete(publicacion);
    }

    @Test
    void eliminaPublicacionCuandoUsuarioEsAdministrador() {
        Publicacion publicacion = crearPublicacion();
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));

        assertDoesNotThrow(() -> publicacionService.eliminarPublicacion(1L, "admin", "ADMIN"));

        verify(publicacionRepository).delete(publicacion);
    }

    @Test
    void rechazaEliminacionCuandoUsuarioNoEsPropietarioNiAdministrador() {
        Publicacion publicacion = crearPublicacion();
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));

        SecurityException exception = assertThrows(SecurityException.class,
                () -> publicacionService.eliminarPublicacion(1L, "pedro", "CLIENTE"));

        org.junit.jupiter.api.Assertions.assertNotNull(exception);
        verify(publicacionRepository, never()).delete(publicacion);
    }
}