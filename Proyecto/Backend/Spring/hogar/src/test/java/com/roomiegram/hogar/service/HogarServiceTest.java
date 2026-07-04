package com.roomiegram.hogar.service;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.hogar.dto.AdminActionRequest;
import com.roomiegram.hogar.dto.CreateHogarRequest;
import com.roomiegram.hogar.dto.RecursoHogarRequest;
import com.roomiegram.hogar.dto.UsuarioRequest;
import com.roomiegram.hogar.model.EstadoVisita;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.repository.HogarRepository;
import com.roomiegram.hogar.repository.VisitaRepository;

@ExtendWith(MockitoExtension.class)
class HogarServiceTest {

    @Mock
    private HogarRepository hogarRepository;

    @Mock
    private NotificationPublisher notificationPublisher;

    @Mock
    private VisitaRepository visitaRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private HogarService hogarService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(hogarService, "usuarioServiceUrl", "http://localhost:8088");
    }

    private void mockSuscripcionPremium(Long usuarioId) {
        when(restTemplate.getForEntity(eq("http://localhost:8088/auth/membresias/usuario/" + usuarioId), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("plan", "PREMIUM_INDIVIDUAL"), HttpStatus.OK));
    }

    @Test
    void crearHogarDebeNormalizarDatosYGuardar() {
        CreateHogarRequest request = new CreateHogarRequest("  Depa Centro  ", "  Cerca del metro  ", 10L);
        mockSuscripcionPremium(10L);
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
        mockSuscripcionPremium(7L);
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Hogar hogar = hogarService.crearHogar(request);

        assertNull(hogar.getDescripcion());
    }

    @Test
    void crearHogarDebeFallarCuandoUsuarioEsGratis() {
        CreateHogarRequest request = new CreateHogarRequest("Hogar Gratis", "Descripcion", 5L);
        when(restTemplate.getForEntity(eq("http://localhost:8088/auth/membresias/usuario/5"), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("plan", "GRATIS"), HttpStatus.OK));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarService.crearHogar(request));

        assertEquals("Los usuarios con plan gratuito no pueden crear grupos de hogar. Actualiza tu suscripcion.",
                exception.getMessage());
        verify(hogarRepository, never()).save(any(Hogar.class));
    }

    @Test
    void solicitarIngresoDebeGuardarSolicitudPendiente() {
        Hogar hogar = crearHogarPersistido();
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(visitaRepository.existsByHogarIdAndUsuarioVisitanteIdAndEstado(1L, 2L, EstadoVisita.REALIZADA))
                .thenReturn(true);

        Hogar actualizado = hogarService.solicitarIngreso(1L, new UsuarioRequest(2L));

        assertTrue(actualizado.getSolicitudesPendientesIds().contains(2L));
        verify(hogarRepository).save(hogar);
        verify(notificationPublisher).publicarSolicitudIngreso(hogar, 2L);
    }

    @Test
    void solicitarIngresoDebeRevertirCuandoNoSePuedeNotificarAlAdministrador() {
        Hogar hogar = crearHogarPersistido();
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));
        when(hogarRepository.save(any(Hogar.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(visitaRepository.existsByHogarIdAndUsuarioVisitanteIdAndEstado(1L, 2L, EstadoVisita.REALIZADA))
                .thenReturn(true);
        org.mockito.Mockito.doThrow(new IllegalStateException("fallo notificacion"))
                .when(notificationPublisher)
                .publicarSolicitudIngreso(hogar, 2L);

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> hogarService.solicitarIngreso(1L, new UsuarioRequest(2L)));

        assertEquals("No se pudo notificar al administrador del hogar", exception.getMessage());
        assertTrue(!hogar.getSolicitudesPendientesIds().contains(2L));
        verify(hogarRepository, org.mockito.Mockito.times(2)).save(hogar);
    }

    @Test
    void solicitarIngresoDebeFallarCuandoNoExisteVisitaRealizada() {
        Hogar hogar = crearHogarPersistido();
        when(hogarRepository.findById(1L)).thenReturn(Optional.of(hogar));
        when(visitaRepository.existsByHogarIdAndUsuarioVisitanteIdAndEstado(1L, 2L, EstadoVisita.REALIZADA))
                .thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> hogarService.solicitarIngreso(1L, new UsuarioRequest(2L)));

        assertEquals(
                "Debes completar una visita al hogar antes de solicitar ingreso. Agenda tu visita desde el panel de hogares.",
                exception.getMessage());
        verify(hogarRepository, never()).save(any(Hogar.class));
        verify(notificationPublisher, never()).publicarSolicitudIngreso(any(Hogar.class), any(Long.class));
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