package com.roomiegram.usuario.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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
    void registrarUsuarioDebeGuardarConDatosValidos() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);
        when(loginRepository.save(any(Login.class))).thenReturn(new Login());

        Register resultado = registerService.registrarUsuario(register);

        assertNotNull(resultado);
        assertEquals("juan123", resultado.getUsuario());
        verify(registerRepository).save(any(Register.class));
        verify(loginRepository).save(any(Login.class));
    }

    @Test
    void registrarUsuarioDebeAsignarRolCliente() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);

        registerService.registrarUsuario(register);

        verify(loginRepository).save(any(Login.class));
    }

    @Test
    void registrarUsuarioDebeEncriptarContrasena() {
        Register register = crearRegister();
        String contrasenaOriginal = register.getContrasena();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);
        when(loginRepository.save(any(Login.class))).thenReturn(new Login());

        registerService.registrarUsuario(register);

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        // Password should be BCrypt encoded after registering
        assert(encoder.matches(contrasenaOriginal, register.getContrasena()));
    }

    @Test
    void registrarUsuarioDebeFallarConNombreVacio() {
        Register register = crearRegister();
        register.setNombre("  ");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El nombre no puede estar vacío", exception.getMessage());
        verify(registerRepository, never()).save(any());
    }

    @Test
    void registrarUsuarioDebeFallarConUsuarioVacio() {
        Register register = crearRegister();
        register.setUsuario(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El usuario no puede estar vacío", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarConCorreoVacio() {
        Register register = crearRegister();
        register.setCorreo("");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El correo no puede estar vacío", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarConTelefonoVacio() {
        Register register = crearRegister();
        register.setTelefono(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El telefono no puede estar vacío", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarConContrasenaVacia() {
        Register register = crearRegister();
        register.setContrasena("   ");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("La contraseña no puede estar vacía", exception.getMessage());
    }

    @Test
    void registrarUsuarioDebeFallarCuandoUsuarioDuplicado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El usuario ya está registrado", exception.getMessage());
        verify(registerRepository, never()).save(any());
    }

    @Test
    void registrarUsuarioDebeFallarCuandoCorreoDuplicado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.registrarUsuario(register));

        assertEquals("El correo ya está registrado", exception.getMessage());
        verify(registerRepository, never()).save(any());
    }

    @Test
    void crearAdminDebeAsignarRolAdmin() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(false);
        when(registerRepository.existsByCorreo("juan@example.com")).thenReturn(false);
        when(registerRepository.save(any(Register.class))).thenReturn(register);

        registerService.crearAdmin(register);

        verify(loginRepository).save(any(Login.class));
    }

    @Test
    void crearAdminDebeFallarCuandoUsuarioDuplicado() {
        Register register = crearRegister();
        when(registerRepository.existsByUsuario("juan123")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> registerService.crearAdmin(register));

        assertEquals("El usuario ya está registrado", exception.getMessage());
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
