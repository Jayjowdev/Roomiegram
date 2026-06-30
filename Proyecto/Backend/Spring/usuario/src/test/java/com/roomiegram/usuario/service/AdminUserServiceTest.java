package com.roomiegram.usuario.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private RegisterRepository registerRepository;

    @Mock
    private LoginRepository loginRepository;

    private AdminUserService adminUserService;

    @BeforeEach
    void setUp() {
        adminUserService = new AdminUserService(registerRepository, loginRepository);
    }

    @Test
    void suspenderUsuarioDebeMarcarCuentaInactiva() {
        Register admin = crearRegister(1L, "admin");
        Register cliente = crearRegister(2L, "franco");

        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(cliente));
        when(loginRepository.findByUsuario("admin")).thenReturn(Optional.of(crearLogin("admin", Role.ADMIN)));
        when(loginRepository.findByUsuario("franco")).thenReturn(Optional.of(crearLogin("franco", Role.CLIENTE)));
        when(registerRepository.save(cliente)).thenReturn(cliente);

        Map<String, Object> resultado = adminUserService.suspenderUsuario(2L, 1L, "ADMIN");

        assertFalse((Boolean) resultado.get("cuentaActiva"));
        assertFalse(cliente.isCuentaActiva());
        assertEquals("Suspendida", resultado.get("estadoCuenta"));
        verify(registerRepository).save(cliente);
    }

    @Test
    void reactivarUsuarioDebeMarcarCuentaActiva() {
        Register admin = crearRegister(1L, "admin");
        Register cliente = crearRegister(2L, "franco");
        cliente.setCuentaActiva(false);

        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(cliente));
        when(loginRepository.findByUsuario("admin")).thenReturn(Optional.of(crearLogin("admin", Role.ADMIN)));
        when(registerRepository.save(cliente)).thenReturn(cliente);

        Map<String, Object> resultado = adminUserService.reactivarUsuario(2L, 1L, "ADMIN");

        assertTrue((Boolean) resultado.get("cuentaActiva"));
        assertTrue(cliente.isCuentaActiva());
        assertEquals("Activa", resultado.get("estadoCuenta"));
        verify(registerRepository).save(cliente);
    }

    @Test
    void aprobarColaboradorDebeMarcarAprobadoYActivo() {
        Register admin = crearRegister(1L, "admin");
        Register colaborador = crearRegister(2L, "colaborador");
        Login loginColaborador = crearLogin("colaborador", Role.COLABORADOR);
        loginColaborador.setAprobado(false);
        colaborador.setCuentaActiva(false);

        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(colaborador));
        when(loginRepository.findByUsuario("admin")).thenReturn(Optional.of(crearLogin("admin", Role.ADMIN)));
        when(loginRepository.findByUsuario("colaborador")).thenReturn(Optional.of(loginColaborador));
        when(registerRepository.save(colaborador)).thenReturn(colaborador);

        Map<String, Object> resultado = adminUserService.aprobarColaborador(2L, 1L, "ADMIN");

        assertTrue(loginColaborador.isAprobado());
        assertTrue(colaborador.isCuentaActiva());
        assertEquals(true, resultado.get("aprobado"));
        verify(loginRepository).save(loginColaborador);
        verify(registerRepository).save(colaborador);
    }

    @Test
    void rechazarColaboradorDebeMantenerPendienteYSuspenderCuenta() {
        Register admin = crearRegister(1L, "admin");
        Register colaborador = crearRegister(2L, "colaborador");
        Login loginColaborador = crearLogin("colaborador", Role.COLABORADOR);

        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(colaborador));
        when(loginRepository.findByUsuario("admin")).thenReturn(Optional.of(crearLogin("admin", Role.ADMIN)));
        when(loginRepository.findByUsuario("colaborador")).thenReturn(Optional.of(loginColaborador));
        when(registerRepository.save(colaborador)).thenReturn(colaborador);

        Map<String, Object> resultado = adminUserService.rechazarColaborador(2L, 1L, "ADMIN");

        assertFalse(loginColaborador.isAprobado());
        assertFalse(colaborador.isCuentaActiva());
        assertEquals(false, resultado.get("aprobado"));
        verify(loginRepository).save(loginColaborador);
        verify(registerRepository).save(colaborador);
    }

    @Test
    void restablecerContrasenaDebeActualizarRegisterYLogin() {
        Register admin = crearRegister(1L, "admin");
        Register cliente = crearRegister(2L, "franco");
        Login loginCliente = crearLogin("franco", Role.CLIENTE);

        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(registerRepository.findById(2L)).thenReturn(Optional.of(cliente));
        when(loginRepository.findByUsuario("admin")).thenReturn(Optional.of(crearLogin("admin", Role.ADMIN)));
        when(loginRepository.findByUsuario("franco")).thenReturn(Optional.of(loginCliente));

        Map<String, Object> resultado = adminUserService.restablecerContrasena(2L, 1L, "ADMIN");

        assertNotNull(resultado.get("contrasenaTemporal"));
        assertEquals(10, resultado.get("contrasenaTemporal").toString().length());
        assertEquals(cliente.getContrasena(), loginCliente.getContrasena());
        assertFalse(new BCryptPasswordEncoder().matches("anterior123", loginCliente.getContrasena()));
        verify(registerRepository).save(cliente);
        verify(loginRepository).save(loginCliente);
    }

    @Test
    void eliminarUsuarioDebeBloquearAdminActual() {
        Register admin = crearRegister(1L, "admin");
        when(registerRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(loginRepository.findByUsuario("admin")).thenReturn(Optional.of(crearLogin("admin", Role.ADMIN)));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> adminUserService.eliminarUsuario(1L, 1L, "ADMIN"));

        assertEquals("No puedes eliminar tu propia cuenta administrativa", exception.getMessage());
    }

    private Register crearRegister(Long id, String usuario) {
        Register register = new Register();
        register.setId(id);
        register.setNombre(usuario);
        register.setUsuario(usuario);
        register.setCorreo(usuario + "@roomiegram.cl");
        register.setTelefono("900000000");
        register.setContrasena("anterior123");
        register.setCuentaActiva(true);
        return register;
    }

    private Login crearLogin(String usuario, Role role) {
        Login login = new Login();
        login.setUsuario(usuario);
        login.setRole(role);
        login.setContrasena("anterior123");
        return login;
    }
}
