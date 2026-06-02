package com.roomiegram.usuario.service;

import java.util.Optional;
import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@Service
public class LoginService {

    private static final String PASSWORD_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 10;

    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private LoginRepository loginRepository;

    @Autowired
    private RegisterRepository registerRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@roomiegram.com}")
    private String mailFrom;

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

    @Transactional
    public void recuperarContrasena(String correo) {
        if (correo == null || correo.trim().isEmpty()) {
            throw new IllegalArgumentException("El correo no puede estar vacío");
        }

        String correoNormalizado = correo.trim();
        Register register = registerRepository.findByCorreo(correoNormalizado)
                .orElseThrow(() -> new IllegalArgumentException("No existe una cuenta con ese correo"));

        Login login = loginRepository.findByUsuario(register.getUsuario())
                .orElseThrow(() -> new IllegalStateException("No se encontro la cuenta de acceso asociada al usuario"));

        String contrasenaTemporal = generarContrasenaTemporal();
        String contrasenaEncriptada = passwordEncoder.encode(contrasenaTemporal);

        register.setContrasena(contrasenaEncriptada);
        login.setContrasena(contrasenaEncriptada);

        registerRepository.save(register);
        loginRepository.save(login);

        enviarCorreoRecuperacion(correoNormalizado, register.getNombre(), contrasenaTemporal);
    }

    private void enviarCorreoRecuperacion(String correoDestino, String nombre, String contrasenaTemporal) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(correoDestino);
            mailMessage.setSubject("Recuperacion de contrasena - Roomiegram");
            mailMessage.setText(
                    "Hola " + (nombre == null || nombre.isBlank() ? "Roomie" : nombre) + ",\n\n"
                            + "Recibimos una solicitud para recuperar tu contrasena.\n"
                            + "Tu nueva contrasena temporal es: " + contrasenaTemporal + "\n\n"
                            + "Te recomendamos iniciar sesion y cambiarla de inmediato.\n\n"
                            + "Equipo Roomiegram");

            mailSender.send(mailMessage);
        } catch (MailException e) {
            throw new IllegalStateException("No fue posible enviar el correo de recuperacion", e);
        }
    }

    private String generarContrasenaTemporal() {
        StringBuilder passwordBuilder = new StringBuilder();
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            int index = secureRandom.nextInt(PASSWORD_CHARACTERS.length());
            passwordBuilder.append(PASSWORD_CHARACTERS.charAt(index));
        }
        return passwordBuilder.toString();
    }
}
