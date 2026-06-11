package com.roomiegram.usuario.controller;

import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.service.LoginService;

@RestController
@RequestMapping("/auth")
public class LoginController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private LoginService loginService;

    @Autowired
    private RegisterRepository registerRepository;

    @PostMapping("/login")
    public ResponseEntity<?> autenticarUsuario(@RequestBody Map<String, String> credenciales) {
        try {
            String usuario = credenciales.get("usuario");
            String contrasena = credenciales.get("contrasena");

            Login login = loginService.autenticarUsuario(usuario, contrasena);

            Optional<Register> reg = registerRepository.findByUsuario(login.getUsuario());
            Long id = reg.map(Register::getId).orElse(login.getId());
            String nombre = reg.map(Register::getNombre).orElse(login.getUsuario());
            String correo = reg.map(Register::getCorreo).orElse("");
            String telefono = reg.map(Register::getTelefono).orElse("");
            String fotoPerfil = reg.map(Register::getFotoPerfil).orElse("");
            String descripcion = reg.map(Register::getDescripcion).orElse("");
            java.util.List<String> intereses = reg.map(Register::getIntereses).orElse(java.util.List.of());
            boolean estaEnCasa = reg.map(Register::isEstaEnCasa).orElse(false);
            String hogarActual = reg.map(Register::getHogarActual).orElse("");
            Object preferenciasCompatibilidad = reg
                    .map(Register::getPreferenciasCompatibilidad)
                    .map(this::parsePreferencias)
                    .orElse(Map.of());

            // Retornar informacion del usuario autenticado (sin la contraseña)
            return ResponseEntity.ok(Map.ofEntries(
                Map.entry("id", id),
                Map.entry("usuario", login.getUsuario()),
                Map.entry("nombre", nombre),
                Map.entry("correo", correo),
                Map.entry("telefono", telefono == null ? "" : telefono),
                Map.entry("fotoPerfil", fotoPerfil == null ? "" : fotoPerfil),
                Map.entry("descripcion", descripcion == null ? "" : descripcion),
                Map.entry("intereses", intereses == null ? java.util.List.of() : intereses),
                Map.entry("estaEnCasa", estaEnCasa),
                Map.entry("hogarActual", hogarActual == null ? "" : hogarActual),
                Map.entry("preferenciasCompatibilidad", preferenciasCompatibilidad),
                Map.entry("role", login.getRole().name()),
                Map.entry("mensaje", "Login exitoso")
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "mensaje", e.getMessage()
            ));
        }
    }

    @PostMapping("/recover-password")
    public ResponseEntity<?> recuperarContrasena(@RequestBody Map<String, String> request) {
        try {
            String correo = request.get("correo");
            loginService.recuperarContrasena(correo);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Te enviamos una contrasena temporal a tu correo"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "mensaje", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "mensaje", e.getMessage()
            ));
        }
    }

    @PutMapping("/change-password/{id}")
    public ResponseEntity<?> cambiarContrasena(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            loginService.cambiarContrasena(
                    id,
                    request.get("contrasenaActual"),
                    request.get("nuevaContrasena"),
                    request.get("confirmarContrasena"));

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Contrasena actualizada correctamente"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "mensaje", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "mensaje", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/check/{usuario}")
    public ResponseEntity<?> verificarUsuario(@PathVariable String usuario) {
        boolean existe = loginService.existeUsuario(usuario);
        return ResponseEntity.ok(Map.of(
            "existe", existe
        ));
    }

    private Object parsePreferencias(String preferencias) {
        if (preferencias == null || preferencias.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(preferencias, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

}
