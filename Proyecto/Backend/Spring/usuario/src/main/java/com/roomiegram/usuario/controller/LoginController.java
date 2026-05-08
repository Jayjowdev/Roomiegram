package com.roomiegram.usuario.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.service.LoginService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*") // para conectar con frontend react 
public class LoginController {
    
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

            // Retornar informacion del usuario autenticado (sin la contraseña)
            return ResponseEntity.ok(Map.of(
                "id", id,
                "usuario", login.getUsuario(),
                "nombre", nombre,
                "correo", correo,
                "role", login.getRole().name(),
                "mensaje", "Login exitoso"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
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

}
