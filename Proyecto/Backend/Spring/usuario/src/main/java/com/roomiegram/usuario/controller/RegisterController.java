package com.roomiegram.usuario.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.DTO.CreateAdminRequest;
import com.roomiegram.usuario.DTO.RegisterRequest;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.service.RegisterService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*") // para conectar con frontend react

public class RegisterController {
    
    @Autowired
    private RegisterService registerService;

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