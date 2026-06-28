package com.roomiegram.publicacion.service;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
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
    void eliminaPublicacionCuandoUsuarioEsAdministradorAunqueNoSeaPropietario() {
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

    @Test
    void guardaPublicacionBuscoRoomieSinExigirDetallesDeCasa() {
        Publicacion publicacion = crearPublicacion();
        publicacion.setTipo("busco_roomie");
        publicacion.setNumeroHabitaciones(0);
        publicacion.setNumeroPersonas(0);
        publicacion.setNumeroBanos(0);
        when(publicacionRepository.save(any(Publicacion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Publicacion guardada = publicacionService.guardarPublicacion(publicacion);

        assertEquals("busco_roomie", guardada.getTipo());
        assertEquals(0, guardada.getNumeroHabitaciones());
        assertEquals(0, guardada.getNumeroPersonas());
        assertEquals(0, guardada.getNumeroBanos());
    }

    @Test
    void guardaPublicacionDeCasaConTipoPorDefecto() {
        Publicacion publicacion = crearPublicacion();
        when(publicacionRepository.save(any(Publicacion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Publicacion guardada = publicacionService.guardarPublicacion(publicacion);

        assertEquals("ofrezco_casa", guardada.getTipo());
    }

    @Test
    void actualizaPublicacionCuandoUsuarioEsPropietario() {
        Publicacion publicacion = crearPublicacion();
        Publicacion datos = crearPublicacion();
        datos.setTitulo("Habitacion actualizada");
        datos.setDescripcion("Descripcion actualizada con informacion suficiente");
        datos.setUbicacion("Providencia");
        datos.setPrecio(300000.0);
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));
        when(publicacionRepository.save(any(Publicacion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Publicacion actualizada = publicacionService.actualizarPublicacion(1L, datos, "juan", "CLIENTE");

        assertEquals("Habitacion actualizada", actualizada.getTitulo());
        assertEquals("Providencia", actualizada.getUbicacion());
        assertEquals(300000.0, actualizada.getPrecio());
    }

    @Test
    void actualizaImagenesDePublicacion() {
        Publicacion publicacion = crearPublicacion();
        publicacion.setImagen("foto-anterior");
        publicacion.setGaleria(List.of("foto-anterior"));
        Publicacion datos = crearPublicacion();
        datos.setImagen("foto-nueva");
        datos.setGaleria(List.of("foto-nueva", "foto-extra"));
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));
        when(publicacionRepository.save(any(Publicacion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Publicacion actualizada = publicacionService.actualizarPublicacion(1L, datos, "juan", "CLIENTE");

        assertEquals("foto-nueva", actualizada.getImagen());
        assertEquals(List.of("foto-nueva", "foto-extra"), actualizada.getGaleria());
    }

    @Test
    void actualizaPublicacionBuscoRoomieSinDetallesDeCasa() {
        Publicacion publicacion = crearPublicacion();
        publicacion.setTipo("busco_roomie");
        Publicacion datos = crearPublicacion();
        datos.setTitulo("Busco hogar actualizado");
        datos.setNumeroHabitaciones(5);
        datos.setNumeroPersonas(5);
        datos.setNumeroBanos(5);
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));
        when(publicacionRepository.save(any(Publicacion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Publicacion actualizada = publicacionService.actualizarPublicacion(1L, datos, "juan", "CLIENTE");

        assertEquals("busco_roomie", actualizada.getTipo());
        assertEquals(0, actualizada.getNumeroHabitaciones());
        assertEquals(0, actualizada.getNumeroPersonas());
        assertEquals(0, actualizada.getNumeroBanos());
    }

    @Test
    void rechazaActualizacionCuandoUsuarioNoEsPropietarioNiAdministrador() {
        Publicacion publicacion = crearPublicacion();
        when(publicacionRepository.findById(1L)).thenReturn(Optional.of(publicacion));

        assertThrows(SecurityException.class,
                () -> publicacionService.actualizarPublicacion(1L, crearPublicacion(), "pedro", "CLIENTE"));

        verify(publicacionRepository, never()).save(any(Publicacion.class));
    }
}
