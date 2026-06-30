package com.roomiegram.usuario.controller;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomiegram.usuario.DTO.RegisterRequest;
import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.service.RegisterService;

@ExtendWith(MockitoExtension.class)
class RegisterControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RegisterService registerService;

    @Mock
    private RegisterRepository registerRepository;

    @Mock
    private LoginRepository loginRepository;

    @InjectMocks
    private RegisterController registerController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(registerController).build();
    }

    @Test
    void registrarClienteDebeRetornar201() throws Exception {
        RegisterRequest request = new RegisterRequest("Juan", "juan@example.com", "912345678", "contrasena123", "juan123", null);
        Register response = crearRegister(1L);
        when(registerService.registrarUsuario(any(Register.class), eq(Role.CLIENTE))).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario").value("juan123"))
                .andExpect(jsonPath("$.nombre").value("Juan"))
                .andExpect(jsonPath("$.role").value("CLIENTE"))
                .andExpect(jsonPath("$.requiereAprobacion").value(false));
    }

    @Test
    void registrarColaboradorDebeRetornarPendiente() throws Exception {
        RegisterRequest request = new RegisterRequest("Juan", "juan@example.com", "912345678", "contrasena123", "juan123", "COLABORADOR");
        Register response = crearRegister(1L);
        when(registerService.registrarUsuario(any(Register.class), eq(Role.COLABORADOR))).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("COLABORADOR"))
                .andExpect(jsonPath("$.requiereAprobacion").value(true));
    }

    @Test
    void registrarDebeRetornar400CuandoServiceFalla() throws Exception {
        RegisterRequest request = new RegisterRequest("", "juan@example.com", "912345678", "contrasena123", "juan123", null);
        when(registerService.registrarUsuario(any(Register.class), eq(Role.CLIENTE)))
                .thenThrow(new IllegalArgumentException("El nombre no puede estar vacio"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registrarDebeRetornar400CuandoUsuarioDuplicado() throws Exception {
        RegisterRequest request = new RegisterRequest("Juan", "juan@example.com", "912345678", "contrasena123", "juan123", null);
        when(registerService.registrarUsuario(any(Register.class), eq(Role.CLIENTE)))
                .thenThrow(new IllegalArgumentException("El usuario ya esta registrado"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void actualizarFotoPerfilDebeRetornar200() throws Exception {
        Register usuario = crearRegister(1L);
        when(registerRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(registerRepository.save(any(Register.class))).thenReturn(usuario);

        String body = objectMapper.writeValueAsString(java.util.Map.of("fotoPerfil", "data:image/png;base64,abc123"));

        mockMvc.perform(put("/auth/profile/1/foto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("juan123"));
    }

    @Test
    void actualizarFotoPerfilDebeRetornar404CuandoUsuarioNoExiste() throws Exception {
        when(registerRepository.findById(99L)).thenReturn(Optional.empty());

        String body = objectMapper.writeValueAsString(java.util.Map.of("fotoPerfil", "data:image/png;base64,abc123"));

        mockMvc.perform(put("/auth/profile/99/foto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    void crearAdminDebeRetornar201() throws Exception {
        com.roomiegram.usuario.DTO.CreateAdminRequest request =
                new com.roomiegram.usuario.DTO.CreateAdminRequest("Admin", "admin123", "admin@example.com", "999888777", "adminpass");
        Register response = crearRegister(2L);
        response.setUsuario("admin123");
        when(registerService.crearAdmin(any(Register.class))).thenReturn(response);

        mockMvc.perform(post("/auth/admin/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario").value("admin123"));
    }

    @Test
    void validarModeradorDebePermitirColaboradorAprobadoActivo() throws Exception {
        Register usuario = crearRegister(3L);
        Login login = new Login();
        login.setUsuario(usuario.getUsuario());
        login.setRole(Role.COLABORADOR);
        login.setAprobado(true);
        when(registerRepository.findById(3L)).thenReturn(Optional.of(usuario));
        when(loginRepository.findByUsuario("juan123")).thenReturn(Optional.of(login));

        mockMvc.perform(get("/auth/usuarios/3/moderador-valido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeModerar").value(true))
                .andExpect(jsonPath("$.role").value("COLABORADOR"));
    }

    @Test
    void validarModeradorDebeRechazarColaboradorPendiente() throws Exception {
        Register usuario = crearRegister(4L);
        Login login = new Login();
        login.setUsuario(usuario.getUsuario());
        login.setRole(Role.COLABORADOR);
        login.setAprobado(false);
        when(registerRepository.findById(4L)).thenReturn(Optional.of(usuario));
        when(loginRepository.findByUsuario("juan123")).thenReturn(Optional.of(login));

        mockMvc.perform(get("/auth/usuarios/4/moderador-valido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeModerar").value(false));
    }

    private Register crearRegister(Long id) {
        Register register = new Register();
        register.setId(id);
        register.setNombre("Juan");
        register.setApellido("Perez");
        register.setCorreo("juan@example.com");
        register.setUsuario("juan123");
        register.setContrasena("contrasenaEncriptada");
        register.setTelefono("912345678");
        return register;
    }
}
