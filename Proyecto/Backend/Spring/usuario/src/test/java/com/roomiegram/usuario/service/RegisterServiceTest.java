package com.roomiegram.usuario.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@ExtendWith(MockitoExtension.class)
class RegisterServiceTest {

    @Mock
    private RegisterRepository registerRepository;

    @Mock
    private LoginRepository loginRepository;

    @InjectMocks
    private RegisterService registerService;

    @Test
    void registrarUsuarioDebeGuardarClienteAprobadoConDatosValidos() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);

        Register resultado = registerService.registrarUsuario(register);

        ArgumentCaptor<Login> loginCaptor = ArgumentCaptor.forClass(Login.class);
        verify(loginRepository).save(loginCaptor.capture());

        assertNotNull(resultado);
        assertEquals("juan123", resultado.getUsuario());
        assertTrue(register.isCuentaActiva());
        assertEquals(Role.CLIENTE, loginCaptor.getValue().getRole());
        assertTrue(loginCaptor.getValue().isAprobado());
    }

    @Test
    void registrarColaboradorDebeGuardarPendienteDeAprobacion() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);

        registerService.registrarUsuario(register, Role.COLABORADOR);

        ArgumentCaptor<Login> loginCaptor = ArgumentCaptor.forClass(Login.class);
        verify(loginRepository).save(loginCaptor.capture());

        assertEquals(Role.COLABORADOR, loginCaptor.getValue().getRole());
        assertFalse(loginCaptor.getValue().isAprobado());
        assertTrue(register.isCuentaActiva());
    }

    @Test
    void registrarUsuarioDebeEncriptarContrasena() {
        Register register = crearRegister();
        String contrasenaOriginal = register.getContrasena();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);

        registerService.registrarUsuario(register);

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertTrue(encoder.matches(contrasenaOriginal, register.getContrasena()));
    }

    @Test
    void registrarUsuarioDebeFallarConNombreVacio() {
        Register register = crearRegister();
        register.setNombre("  ");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El nombre no puede estar vacio", exception.getMessage());
        verify(registerRepository, never()).save(any());
    }

    @Test
    void registrarUsuarioDebeFallarConUsuarioVacio() {
        Register register = crearRegister();
        register.setUsuario(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El usuario no puede estar vacio", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarConCorreoVacio() {
        Register register = crearRegister();
        register.setCorreo("");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El correo no puede estar vacio", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarConTelefonoVacio() {
        Register register = crearRegister();
        register.setTelefono(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El telefono no puede estar vacio", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarConContrasenaVacia() {
        Register register = crearRegister();
        register.setContrasena("   ");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("La contrasena no puede estar vacia", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarCuandoUsuarioDuplicado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El usuario ya esta registrado", exception.getMessage());
        verify(registerRepository, never()).save(any());
    }

    @Test
    void registrarUsuarioDebeFallarCuandoCorreoDuplicado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El correo ya esta registrado", exception.getMessage());
        verify(registerRepository, never()).save(any());
    }

    @Test
    void crearAdminDebeAsignarRolAdminAprobado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);

        registerService.crearAdmin(register);

        ArgumentCaptor<Login> loginCaptor = ArgumentCaptor.forClass(Login.class);
        verify(loginRepository).save(loginCaptor.capture());
        assertEquals(Role.ADMIN, loginCaptor.getValue().getRole());
        assertTrue(loginCaptor.getValue().isAprobado());
    }

    @Test
    void crearAdminDebeFallarCuandoUsuarioDuplicado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.crearAdmin(register));

        assertEquals("El usuario ya esta registrado", exception.getMessage());
    }

    private Register crearRegister() {
        Register register = new Register();
        register.setNombre("Juan");
        register.setApellido("Perez");
        register.setCorreo("juan@example.com");
        register.setUsuario("juan123");
        register.setContrasena("contrasena123");
        register.setTelefono("912345678");
        return register;
    }
}
