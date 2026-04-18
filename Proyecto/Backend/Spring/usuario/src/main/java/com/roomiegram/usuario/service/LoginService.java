package com.roomiegram.usuario.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.repository.LoginRepository;

@Service
public class LoginService {

    @Autowired
    private LoginRepository loginRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Metodo para validar el inicio de sesión
    public Login autenticarUsuario(String usuario , String contrasena) {
        
        //Validaciones
        if (usuario == null || usuario.isEmpty()) {
            throw new IllegalArgumentException("El usuario no puede estar vacío");
        }
        if (contrasena == null || contrasena.isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía");
        }
        
        // Comprobar validaciones del usuario
        Optional<Login> loginOpt = loginRepository.findByUsuario(usuario);
        
        if (loginOpt.isEmpty()) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos");
        }

        Login login = loginOpt.get();

        if (!passwordEncoder.matches(contrasena, login.getContrasena())) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos");
        }
        
        return login;
    }
    

    //Metodo para verificar si un usuario existe

    public boolean existeUsuario(String usuario) {
        return loginRepository.existsByUsuario(usuario);
    }
}
