package com.roomiegram.usuario.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@Service
public class LoginService {

    @Autowired
    private LoginRepository loginRepository;

    @Autowired
    private RegisterRepository registerRepository;

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
        
        String usuarioNormalizado = usuario.trim();
        Optional<Login> loginOpt = loginRepository.findByUsuario(usuarioNormalizado);

        if (loginOpt.isEmpty()) {
            loginOpt = registerRepository.findByCorreo(usuarioNormalizado)
                    .map(Register::getUsuario)
                    .flatMap(loginRepository::findByUsuario);
        }
        
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
