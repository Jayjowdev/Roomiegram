package com.roomiegram.usuario.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@CrossOrigin(origins = "*") // para conectar con frontend react

public class RegisterController {
    
    @Autowired
    private RegisterService registerService;

    @Autowired
    private RegisterRepository registerRepository;

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
            return ResponseEntity.ok(Map.of(
                "id", actualizado.getId(),
                "usuario", actualizado.getUsuario(),
                "nombre", actualizado.getNombre(),
                "correo", actualizado.getCorreo(),
                "role", "CLIENTE",
                "fotoPerfil", actualizado.getFotoPerfil() == null ? "" : actualizado.getFotoPerfil()
            ));
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
}
