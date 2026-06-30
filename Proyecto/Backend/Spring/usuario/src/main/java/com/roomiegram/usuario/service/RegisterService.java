package com.roomiegram.usuario.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@Service
public class RegisterService {

    @Autowired
    private RegisterRepository registerRepository;

    @Autowired
    private LoginRepository loginRepository;

    @Autowired(required = false)
    private NotificationEmailService notificationEmailService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public Register registrarUsuario(Register register) {
        return registrarUsuario(register, Role.CLIENTE);
    }

    @Transactional
    public Register registrarUsuario(Register register, Role role) {
        normalizarCampos(register);
        validarDatosRegistro(register);
        validarDuplicados(register);

        Role rolFinal = role == null ? Role.CLIENTE : role;
        String contrasenaEncriptada = passwordEncoder.encode(register.getContrasena());
        register.setContrasena(contrasenaEncriptada);
        register.setCuentaActiva(true);

        Register registroGuardado = registerRepository.save(register);

        Login login = new Login();
        login.setUsuario(register.getUsuario());
        login.setContrasena(contrasenaEncriptada);
        login.setRole(rolFinal);
        login.setAprobado(rolFinal != Role.COLABORADOR);
        loginRepository.save(login);

        if (notificationEmailService != null) {
            notificationEmailService.enviarCorreoBienvenida(registroGuardado);
        }

        return registroGuardado;
    }

    @Transactional
    public Register crearAdmin(Register register) {
        normalizarCampos(register);
        validarDatosRegistro(register);
        validarDuplicados(register);

        String contrasenaEncriptada = passwordEncoder.encode(register.getContrasena());
        register.setContrasena(contrasenaEncriptada);
        register.setCuentaActiva(true);

        Register registroGuardado = registerRepository.save(register);

        Login login = new Login();
        login.setUsuario(register.getUsuario());
        login.setContrasena(contrasenaEncriptada);
        login.setRole(Role.ADMIN);
        login.setAprobado(true);
        loginRepository.save(login);

        return registroGuardado;
    }

    private void validarDatosRegistro(Register register) {
        if (register.getNombre() == null || register.getNombre().isEmpty()) {
            throw new IllegalArgumentException("El nombre no puede estar vacio");
        }
        if (register.getUsuario() == null || register.getUsuario().isEmpty()) {
            throw new IllegalArgumentException("El usuario no puede estar vacio");
        }
        if (register.getCorreo() == null || register.getCorreo().isEmpty()) {
            throw new IllegalArgumentException("El correo no puede estar vacio");
        }
        if (register.getTelefono() == null || register.getTelefono().isEmpty()) {
            throw new IllegalArgumentException("El telefono no puede estar vacio");
        }
        if (register.getContrasena() == null || register.getContrasena().isEmpty()) {
            throw new IllegalArgumentException("La contrasena no puede estar vacia");
        }
    }

    private void validarDuplicados(Register register) {
        if (registerRepository.existsByUsuario(register.getUsuario())) {
            throw new IllegalArgumentException("El usuario ya esta registrado");
        }
        if (registerRepository.existsByCorreo(register.getCorreo())) {
            throw new IllegalArgumentException("El correo ya esta registrado");
        }
    }

    private void normalizarCampos(Register register) {
        if (register == null) {
            throw new IllegalArgumentException("La solicitud de registro es obligatoria");
        }

        register.setNombre(limpiarTexto(register.getNombre()));
        register.setApellido(limpiarTexto(register.getApellido()));
        register.setCorreo(limpiarTexto(register.getCorreo()));
        register.setUsuario(limpiarTexto(register.getUsuario()));
        register.setTelefono(limpiarTexto(register.getTelefono()));
        register.setContrasena(limpiarTexto(register.getContrasena()));
    }

    private String limpiarTexto(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
