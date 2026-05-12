package com.roomiegram.usuario.controller;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomiegram.usuario.DTO.RegisterRequest;
import com.roomiegram.usuario.model.Register;
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

    @InjectMocks
    private RegisterController registerController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(registerController).build();
    }

    @Test
    void registrarDebeRetornar201() throws Exception {
        RegisterRequest request = new RegisterRequest("Juan", "juan@example.com", "912345678", "contrasena123", "juan123");
        Register response = crearRegister(1L);
        when(registerService.registrarUsuario(any(Register.class))).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario").value("juan123"))
                .andExpect(jsonPath("$.nombre").value("Juan"));
    }

    @Test
    void registrarDebeRetornar400CuandoServiceFalla() throws Exception {
        RegisterRequest request = new RegisterRequest("", "juan@example.com", "912345678", "contrasena123", "juan123");
        when(registerService.registrarUsuario(any(Register.class)))
                .thenThrow(new IllegalArgumentException("El nombre no puede estar vacío"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registrarDebeRetornar400CuandoUsuarioDuplicado() throws Exception {
        RegisterRequest request = new RegisterRequest("Juan", "juan@example.com", "912345678", "contrasena123", "juan123");
        when(registerService.registrarUsuario(any(Register.class)))
                .thenThrow(new IllegalArgumentException("El usuario ya está registrado"));

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
