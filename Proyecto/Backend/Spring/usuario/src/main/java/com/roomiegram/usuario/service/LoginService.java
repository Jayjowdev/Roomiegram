package com.roomiegram.usuario.service;

import java.security.SecureRandom;
import java.util.Optional;

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
    private static final String MAIL_SEND_ERROR_MESSAGE =
            "No se pudo enviar el correo de recuperacion. Verifica la configuracion de correo.";

    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private LoginRepository loginRepository;

    @Autowired
    private RegisterRepository registerRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@roomiegram.com}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

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

        registerRepository.findByUsuario(login.getUsuario())
                .filter(register -> !register.isCuentaActiva())
                .ifPresent(register -> {
                    throw new IllegalArgumentException("La cuenta se encuentra suspendida. Contacta a un administrador.");
                });
        
        return login;
    }
    

    //Metodo para verificar si un usuario existe

    public boolean existeUsuario(String usuario) {
        return loginRepository.existsByUsuario(usuario);
    }

    @Transactional
    public void cambiarContrasena(Long usuarioId, String contrasenaActual, String nuevaContrasena, String confirmarContrasena) {
        if (usuarioId == null) {
            throw new IllegalArgumentException("Usuario no valido");
        }
        if (contrasenaActual == null || contrasenaActual.isBlank()) {
            throw new IllegalArgumentException("Ingresa tu contrasena actual");
        }
        if (nuevaContrasena == null || nuevaContrasena.isBlank()) {
            throw new IllegalArgumentException("Ingresa una nueva contrasena");
        }
        if (confirmarContrasena == null || !nuevaContrasena.equals(confirmarContrasena)) {
            throw new IllegalArgumentException("La nueva contrasena y la confirmacion no coinciden");
        }
        if (nuevaContrasena.length() < 8) {
            throw new IllegalArgumentException("La nueva contrasena debe tener al menos 8 caracteres");
        }

        Register register = registerRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        Login login = loginRepository.findByUsuario(register.getUsuario())
                .orElseThrow(() -> new IllegalStateException("No se encontro la cuenta de acceso asociada al usuario"));

        if (!passwordEncoder.matches(contrasenaActual, login.getContrasena())) {
            throw new IllegalArgumentException("La contrasena actual es incorrecta");
        }

        String contrasenaEncriptada = passwordEncoder.encode(nuevaContrasena);
        register.setContrasena(contrasenaEncriptada);
        login.setContrasena(contrasenaEncriptada);

        registerRepository.save(register);
        loginRepository.save(login);
    }

    @Transactional
    public void recuperarContrasena(String correo) {
        if (correo == null || correo.trim().isEmpty()) {
            throw new IllegalArgumentException("El correo no puede estar vacio");
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
        if (mailSender == null) {
            throw new IllegalStateException(MAIL_SEND_ERROR_MESSAGE);
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(correoDestino);
            mailMessage.setSubject("Recuperacion de contrasena - Roomiegram");
            mailMessage.setText(
                    "Hola " + (nombre == null || nombre.isBlank() ? "Roomie" : nombre) + ",\n\n"
                            + "Recibimos una solicitud para recuperar tu contrasena.\n"
                            + "Tu nueva contrasena temporal es: " + contrasenaTemporal + "\n\n"
                            + "Te recomendamos iniciar sesion y cambiarla de inmediato.\n"
                            + "Entrar a Roomiegram: " + frontendUrl + "\n\n"
                            + "Equipo Roomiegram");

            mailSender.send(mailMessage);
        } catch (MailException e) {
            throw new IllegalStateException(MAIL_SEND_ERROR_MESSAGE, e);
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
