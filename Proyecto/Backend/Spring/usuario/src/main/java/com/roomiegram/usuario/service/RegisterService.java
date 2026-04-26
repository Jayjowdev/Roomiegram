package com.roomiegram.usuario.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

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

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Metodo para registrar un nuevo usuario
    public Register registrarUsuario(Register register) {
        normalizarCampos(register);

        //Validaciones
        if (register.getNombre() == null || register.getNombre().isEmpty()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío");
        }
        if (register.getUsuario() == null || register.getUsuario().isEmpty()) {
            throw new IllegalArgumentException("El usuario no puede estar vacío");
        }
        if (register.getCorreo() == null || register.getCorreo().isEmpty()) {
            throw new IllegalArgumentException("El correo no puede estar vacío");
        }
        if (register.getTelefono() == null || register.getTelefono().isEmpty()) {
            throw new IllegalArgumentException("El telefono no puede estar vacío");
        }
        if (register.getContrasena() == null || register.getContrasena().isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía");
        }
        
        // Verificar si el usuario ya existe
        if (registerRepository.existsByUsuario(register.getUsuario())) {
            throw new IllegalArgumentException("El usuario ya está registrado");
        }
        // Verificar si el correo ya existe
        if (registerRepository.existsByCorreo(register.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        // Encriptar la contraseña antes de guardarla
        String contrasenaEncriptada = passwordEncoder.encode(register.getContrasena());
        register.setContrasena(contrasenaEncriptada);

        //Guardar en Register
        Register registroGuardado = registerRepository.save(register);

        //Crear entrada en Login con rol CLIENTE por defecto
        Login login = new Login();
        login.setUsuario(register.getUsuario());
        login.setContrasena(contrasenaEncriptada);
        login.setRole(Role.CLIENTE);
        loginRepository.save(login);

        return registroGuardado;
    }

    // Metodo para crear un administrador 
    public Register crearAdmin(Register register) {
        normalizarCampos(register);

        //Validaciones
        if (register.getNombre() == null || register.getNombre().isEmpty()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío");
        }
        if (register.getUsuario() == null || register.getUsuario().isEmpty()) {
            throw new IllegalArgumentException("El usuario no puede estar vacío");
        }
        if (register.getCorreo() == null || register.getCorreo().isEmpty()) {
            throw new IllegalArgumentException("El correo no puede estar vacío");
        }
        if (register.getTelefono() == null || register.getTelefono().isEmpty()) {
            throw new IllegalArgumentException("El telefono no puede estar vacío");
        }
        if (register.getContrasena() == null || register.getContrasena().isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía");
        }
        
        // Verificar si el usuario ya existe
        if (registerRepository.existsByUsuario(register.getUsuario())) {
            throw new IllegalArgumentException("El usuario ya está registrado");
        }
        // Verificar si el correo ya existe
        if (registerRepository.existsByCorreo(register.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        // Encriptar la contraseña antes de guardarla
        String contrasenaEncriptada = passwordEncoder.encode(register.getContrasena());
        register.setContrasena(contrasenaEncriptada);

        //Guardar en Register
        Register registroGuardado = registerRepository.save(register);

        //Crear entrada en Login con rol ADMIN por defecto
        Login login = new Login();
        login.setUsuario(register.getUsuario());
        login.setContrasena(contrasenaEncriptada);
        login.setRole(Role.ADMIN);
        loginRepository.save(login);

        return registroGuardado;
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
