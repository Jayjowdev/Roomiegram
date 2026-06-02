package com.roomiegram.usuario.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock
    private LoginRepository loginRepository;

    @Mock
    private RegisterRepository registerRepository;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private LoginService loginService;

    @BeforeEach
    void initMailFrom() {
        ReflectionTestUtils.setField(loginService, "mailFrom", "no-reply@roomiegram.com");
    }

    @Test
    void autenticarUsuarioDebeRetornarLoginConCredencialesCorrectas() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String contrasenaEncriptada = encoder.encode("contrasena123");

        Login login = crearLogin("juan123", contrasenaEncriptada, Role.CLIENTE);
        when(loginRepository.findByUsuario("juan123")).thenReturn(Optional.of(login));

        Login resultado = loginService.autenticarUsuario("juan123", "contrasena123");

        assertNotNull(resultado);
        assertEquals("juan123", resultado.getUsuario());
        assertEquals(Role.CLIENTE, resultado.getRole());
    }

    @Test
    void autenticarUsuarioDebeBuscarPorCorreoCuandoNoEncuentraPorUsuario() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String contrasenaEncriptada = encoder.encode("contrasena123");

        Login login = crearLogin("juan123", contrasenaEncriptada, Role.CLIENTE);
        Register register = new Register();
        register.setUsuario("juan123");

        when(loginRepository.findByUsuario("juan@example.com")).thenReturn(Optional.empty());
        when(registerRepository.findByCorreo("juan@example.com")).thenReturn(Optional.of(register));
        when(loginRepository.findByUsuario("juan123")).thenReturn(Optional.of(login));

        Login resultado = loginService.autenticarUsuario("juan@example.com", "contrasena123");

        assertNotNull(resultado);
        assertEquals("juan123", resultado.getUsuario());
    }

    @Test
    void autenticarUsuarioDebeFallarConContrasenaIncorrecta() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String contrasenaEncriptada = encoder.encode("contrasena123");

        Login login = crearLogin("juan123", contrasenaEncriptada, Role.CLIENTE);
        when(loginRepository.findByUsuario("juan123")).thenReturn(Optional.of(login));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> loginService.autenticarUsuario("juan123", "contrasenaIncorrecta"));

        assertEquals("Usuario o contraseña incorrectos", exception.getMessage());
    }

    @Test
    void autenticarUsuarioDebeFallarCuandoUsuarioNoExiste() {
        when(loginRepository.findByUsuario("noExiste")).thenReturn(Optional.empty());
        when(registerRepository.findByCorreo("noExiste")).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> loginService.autenticarUsuario("noExiste", "contrasena123"));

        assertEquals("Usuario o contraseña incorrectos", exception.getMessage());
    }

    @Test
    void autenticarUsuarioDebeFallarConUsuarioVacio() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> loginService.autenticarUsuario("", "contrasena123"));

        assertEquals("El usuario no puede estar vacío", exception.getMessage());
    }

    @Test
    void autenticarUsuarioDebeFallarConContrasenaVacia() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> loginService.autenticarUsuario("juan123", null));

        assertEquals("La contraseña no puede estar vacía", exception.getMessage());
    }

    @Test
    void existeUsuarioDebeRetornarTrueCuandoExiste() {
        when(loginRepository.existsByUsuario("juan123")).thenReturn(true);

        assertTrue(loginService.existeUsuario("juan123"));
    }

    @Test
    void existeUsuarioDebeRetornarFalseCuandoNoExiste() {
        when(loginRepository.existsByUsuario("noExiste")).thenReturn(false);

        assertFalse(loginService.existeUsuario("noExiste"));
    }

    @Test
    void recuperarContrasenaDebeActualizarPasswordYEnviarCorreo() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String passwordVieja = encoder.encode("contrasenaVieja123");

        Register register = new Register();
        register.setUsuario("juan123");
        register.setCorreo("juan@example.com");
        register.setNombre("Juan");
        register.setContrasena(passwordVieja);

        Login login = crearLogin("juan123", passwordVieja, Role.CLIENTE);

        when(registerRepository.findByCorreo("juan@example.com")).thenReturn(Optional.of(register));
        when(loginRepository.findByUsuario("juan123")).thenReturn(Optional.of(login));

        loginService.recuperarContrasena("juan@example.com");

        ArgumentCaptor<Register> registerCaptor = ArgumentCaptor.forClass(Register.class);
        ArgumentCaptor<Login> loginCaptor = ArgumentCaptor.forClass(Login.class);

        verify(registerRepository).save(registerCaptor.capture());
        verify(loginRepository).save(loginCaptor.capture());
        verify(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        String nuevaEnRegister = registerCaptor.getValue().getContrasena();
        String nuevaEnLogin = loginCaptor.getValue().getContrasena();

        assertNotNull(nuevaEnRegister);
        assertNotNull(nuevaEnLogin);
        assertFalse(nuevaEnRegister.equals(passwordVieja));
        assertFalse(nuevaEnLogin.equals(passwordVieja));
        assertEquals(nuevaEnRegister, nuevaEnLogin);
    }

    @Test
    void recuperarContrasenaDebeFallarCuandoCorreoNoExiste() {
        when(registerRepository.findByCorreo("noexiste@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> loginService.recuperarContrasena("noexiste@example.com"));

        assertEquals("No existe una cuenta con ese correo", exception.getMessage());
    }

    private Login crearLogin(String usuario, String contrasena, Role role) {
        Login login = new Login();
        login.setId(1L);
        login.setUsuario(usuario);
        login.setContrasena(contrasena);
        login.setRole(role);
        return login;
    }
}
