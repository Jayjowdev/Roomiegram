package com.roomiegram.usuario.controller;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.service.LoginService;

@ExtendWith(MockitoExtension.class)
class LoginControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private LoginService loginService;

    @Mock
    private RegisterRepository registerRepository;

    @InjectMocks
    private LoginController loginController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(loginController).build();
    }

    @Test
    void loginDebeRetornar200ConCredencialesValidas() throws Exception {
        Login login = crearLogin("juan123", Role.CLIENTE);
        Register register = crearRegister("juan123");
        when(loginService.autenticarUsuario("juan123", "contrasena123")).thenReturn(login);
        when(registerRepository.findByUsuario("juan123")).thenReturn(Optional.of(register));

        Map<String, String> credenciales = Map.of("usuario", "juan123", "contrasena", "contrasena123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(credenciales)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("juan123"))
                .andExpect(jsonPath("$.role").value("CLIENTE"))
                .andExpect(jsonPath("$.mensaje").value("Login exitoso"));
    }

    @Test
    void loginDebeRetornar401ConCredencialesInvalidas() throws Exception {
        when(loginService.autenticarUsuario("juan123", "incorrecta"))
                .thenThrow(new IllegalArgumentException("Usuario o contraseña incorrectos"));

        Map<String, String> credenciales = Map.of("usuario", "juan123", "contrasena", "incorrecta");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(credenciales)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void verificarUsuarioDebeRetornarTrueCuandoExiste() throws Exception {
        when(loginService.existeUsuario("juan123")).thenReturn(true);

        mockMvc.perform(get("/auth/check/juan123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(true));
    }

    @Test
    void verificarUsuarioDebeRetornarFalseCuandoNoExiste() throws Exception {
        when(loginService.existeUsuario("noExiste")).thenReturn(false);

        mockMvc.perform(get("/auth/check/noExiste"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(false));
    }

    private Login crearLogin(String usuario, Role role) {
        Login login = new Login();
        login.setId(1L);
        login.setUsuario(usuario);
        login.setContrasena("contrasenaEncriptada");
        login.setRole(role);
        return login;
    }

    private Register crearRegister(String usuario) {
        Register register = new Register();
        register.setId(1L);
        register.setNombre("Juan");
        register.setApellido("Perez");
        register.setCorreo("juan@example.com");
        register.setUsuario(usuario);
        register.setContrasena("contrasenaEncriptada");
        register.setTelefono("912345678");
        return register;
    }
}
