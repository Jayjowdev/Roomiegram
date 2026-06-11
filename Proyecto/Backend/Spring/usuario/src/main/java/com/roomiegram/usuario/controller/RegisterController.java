package com.roomiegram.usuario.controller;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.DTO.CreateAdminRequest;
import com.roomiegram.usuario.DTO.RegisterRequest;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.service.RegisterService;

@RestController
@RequestMapping("/auth")

public class RegisterController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private RegisterService registerService;

    @Autowired
    private RegisterRepository registerRepository;

    @GetMapping("/usuarios")
    public ResponseEntity<?> listarUsuarios() {
        List<Map<String, Object>> usuarios = registerRepository.findAll().stream()
                .map(this::toPublicUser)
                .toList();

        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/usuarios/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        return registerRepository.findById(id)
                .<ResponseEntity<?>>map(usuario -> ResponseEntity.ok(toPublicUser(usuario)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "mensaje", "Usuario no encontrado"
                )));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrarUsuario(@RequestBody RegisterRequest request){
        try{
            Register register = new Register();
            register.setNombre(request.nombre());
            register.setCorreo(request.correo());
            register.setUsuario(request.usuario());
            register.setContrasena(request.contrasena());
            register.setTelefono(request.telefono());
    
            
            Register resultado = registerService.registrarUsuario(register);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/profile/{id}/foto")
    public ResponseEntity<?> actualizarFotoPerfil(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return registerRepository.findById(id).<ResponseEntity<?>>map(usuario -> {
            usuario.setFotoPerfil(request.get("fotoPerfil"));
            Register actualizado = registerRepository.save(usuario);
            return ResponseEntity.ok(toSessionUser(actualizado));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "mensaje", "Usuario no encontrado"
        )));
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<?> actualizarPerfil(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return registerRepository.findById(id).<ResponseEntity<?>>map(usuario -> {
            if (request.containsKey("fotoPerfil")) {
                usuario.setFotoPerfil(toNullableString(request.get("fotoPerfil")));
            }
            if (request.containsKey("descripcion")) {
                usuario.setDescripcion(toNullableString(request.get("descripcion")));
            }
            if (request.containsKey("hogarActual")) {
                usuario.setHogarActual(toNullableString(request.get("hogarActual")));
            }
            if (request.containsKey("estaEnCasa") && request.get("estaEnCasa") instanceof Boolean estaEnCasa) {
                usuario.setEstaEnCasa(estaEnCasa);
            }
            if (request.containsKey("intereses") && request.get("intereses") instanceof List<?> intereses) {
                usuario.setIntereses(intereses.stream()
                        .filter(item -> item != null && !item.toString().isBlank())
                        .map(Object::toString)
                        .toList());
            }
            if (request.containsKey("preferenciasCompatibilidad")) {
                Object preferencias = request.get("preferenciasCompatibilidad");
                try {
                    usuario.setPreferenciasCompatibilidad(preferencias == null ? null : objectMapper.writeValueAsString(preferencias));
                } catch (JsonProcessingException e) {
                    throw new IllegalArgumentException("No se pudieron guardar las preferencias");
                }
            }

            Register actualizado = registerRepository.save(usuario);
            return ResponseEntity.ok(toSessionUser(actualizado));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "mensaje", "Usuario no encontrado"
        )));
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crearAdmin(@RequestBody CreateAdminRequest request) {
        try {
            Register register = new Register();
            register.setNombre(request.nombre());
            register.setCorreo(request.correo());
            register.setUsuario(request.usuario());
            register.setContrasena(request.contrasena());
            register.setTelefono(request.telefono());

            Register resultado = registerService.crearAdmin(register);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    private Map<String, Object> toPublicUser(Register usuario) {
        return Map.ofEntries(
                Map.entry("id", usuario.getId()),
                Map.entry("usuario", usuario.getUsuario()),
                Map.entry("nombre", usuario.getNombre()),
                Map.entry("correo", usuario.getCorreo()),
                Map.entry("telefono", usuario.getTelefono() == null ? "" : usuario.getTelefono()),
                Map.entry("fotoPerfil", usuario.getFotoPerfil() == null ? "" : usuario.getFotoPerfil()),
                Map.entry("descripcion", usuario.getDescripcion() == null ? "" : usuario.getDescripcion()),
                Map.entry("intereses", usuario.getIntereses() == null ? List.of() : usuario.getIntereses()),
                Map.entry("estaEnCasa", usuario.isEstaEnCasa()),
                Map.entry("hogarActual", usuario.getHogarActual() == null ? "" : usuario.getHogarActual()),
                Map.entry("preferenciasCompatibilidad", parsePreferencias(usuario.getPreferenciasCompatibilidad()))
        );
    }

    private Map<String, Object> toSessionUser(Register usuario) {
        return Map.ofEntries(
                Map.entry("id", usuario.getId()),
                Map.entry("usuario", usuario.getUsuario()),
                Map.entry("nombre", usuario.getNombre()),
                Map.entry("correo", usuario.getCorreo()),
                Map.entry("telefono", usuario.getTelefono() == null ? "" : usuario.getTelefono()),
                Map.entry("role", "CLIENTE"),
                Map.entry("fotoPerfil", usuario.getFotoPerfil() == null ? "" : usuario.getFotoPerfil()),
                Map.entry("descripcion", usuario.getDescripcion() == null ? "" : usuario.getDescripcion()),
                Map.entry("intereses", usuario.getIntereses() == null ? List.of() : usuario.getIntereses()),
                Map.entry("estaEnCasa", usuario.isEstaEnCasa()),
                Map.entry("hogarActual", usuario.getHogarActual() == null ? "" : usuario.getHogarActual()),
                Map.entry("preferenciasCompatibilidad", parsePreferencias(usuario.getPreferenciasCompatibilidad()))
        );
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

    private String toNullableString(Object value) {
        if (value == null) {
            return null;
        }

        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }
}
