package com.roomiegram.hogar.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.roomiegram.hogar.dto.AdminActionRequest;
import com.roomiegram.hogar.dto.CreateHogarRequest;
import com.roomiegram.hogar.dto.RecursoHogarRequest;
import com.roomiegram.hogar.dto.UsuarioRequest;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.repository.HogarRepository;

@ExtendWith(MockitoExtension.class)
class HogarServiceTest {

    @Mock
    private HogarRepository hogarRepository;

    @InjectMocks
    private HogarService hogarService;

    @Test
    void crearHogarDebeNormalizarDatosYGuardar() {
        CreateHogarRequest request = new CreateHogarRequest("  Depa Centro  ", "  Cerca del metro  ", 10L);
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Hogar hogar = hogarService.crearHogar(request);

        assertEquals("Depa Centro", hogar.getNombre());
        assertEquals("Cerca del metro", hogar.getDescripcion());
        assertEquals(10L, hogar.getUsuarioCreadorId());
        assertEquals(10L, hogar.getUsuarioAdministradorId());
        assertTrue(hogar.isActivo());
        verify(hogarRepository).save(any(Hogar.class));
    }

    @Test
    void crearHogarDebePermitirDescripcionVaciaComoNull() {
        CreateHogarRequest request = new CreateHogarRequest("Hogar Norte", "   ", 7L);
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Hogar hogar = hogarService.crearHogar(request);

        assertNull(hogar.getDescripcion());
    }

    @Test
    void solicitarIngresoDebeGuardarSolicitudPendiente() {
        Hogar hogar = crearHogarPersistido();
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Hogar actualizado = hogarService.solicitarIngreso(1L, new UsuarioRequest(2L));

        assertTrue(actualizado.getSolicitudesPendientesIds().contains(2L));
        verify(hogarRepository).save(hogar);
    }

    @Test
    void aprobarSolicitudDebeAgregarIntegranteCuandoAdminEsValido() {
        Hogar hogar = crearHogarPersistido();
        hogar.getSolicitudesPendientesIds().add(2L);
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Hogar actualizado = hogarService.aprobarSolicitud(1L, 2L, new AdminActionRequest(1L));

        assertTrue(actualizado.getIntegrantesIds().contains(2L));
        assertTrue(!actualizado.getSolicitudesPendientesIds().contains(2L));
        verify(hogarRepository).save(hogar);
    }

    @Test
    void agregarTareaDebeFallarCuandoSolicitanteNoEsAdministrador() {
        Hogar hogar = crearHogarPersistido();
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarService.agregarTarea(1L, new RecursoHogarRequest(99L, 20L)));

        assertEquals("Solo el administrador del hogar puede realizar esta accion", exception.getMessage());
        verify(hogarRepository, never()).save(any(Hogar.class));
    }

    @Test
    void eliminarHogarDebeBorrarCuandoAdminEsValido() {
        Hogar hogar = crearHogarPersistido();
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));

        hogarService.eliminarHogar(1L, 1L);

        verify(hogarRepository).delete(hogar);
    }

    private Hogar crearHogarPersistido() {
        Hogar hogar = new Hogar();
        hogar.setId(1L);
        hogar.setNombre("Hogar Centro");
        hogar.setDescripcion("Departamento compartido");
        hogar.setUsuarioCreadorId(1L);
        hogar.setUsuarioAdministradorId(1L);
        hogar.setActivo(true);
        hogar.getIntegrantesIds().add(1L);
        return hogar;
    }
}