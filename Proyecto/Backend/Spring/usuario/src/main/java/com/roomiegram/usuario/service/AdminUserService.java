package com.roomiegram.usuario.service;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@Service
public class AdminUserService {

    private static final String PASSWORD_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 10;

    private final RegisterRepository registerRepository;
    private final LoginRepository loginRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminUserService(RegisterRepository registerRepository, LoginRepository loginRepository) {
        this.registerRepository = registerRepository;
        this.loginRepository = loginRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public List<Map<String, Object>> listarUsuarios() {
        return registerRepository.findAll().stream()
                .map(this::toAdminUser)
                .toList();
    }

    public Map<String, Object> obtenerUsuario(Long id) {
        Register usuario = buscarUsuario(id);
        return toAdminUser(usuario);
    }

    public List<Map<String, Object>> listarColaboradoresPendientes(Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);

        return loginRepository.findAll().stream()
                .filter(login -> login.getRole() == Role.COLABORADOR && !login.isAprobado())
                .map(login -> registerRepository.findByUsuario(login.getUsuario())
                        .map(this::toAdminUser)
                        .orElse(null))
                .filter(item -> item != null)
                .toList();
    }

    @Transactional
    public Map<String, Object> suspenderUsuario(Long id, Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);
        validarNoEsAdminActual(id, adminId, "No puedes suspender tu propia cuenta administrativa");

        Register usuario = buscarUsuario(id);
        if (obtenerRol(usuario) == Role.ADMIN) {
            throw new IllegalArgumentException("No se puede suspender una cuenta con rol ADMIN desde esta acción");
        }

        usuario.setCuentaActiva(false);
        return toAdminUser(registerRepository.save(usuario));
    }

    @Transactional
    public Map<String, Object> reactivarUsuario(Long id, Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);

        Register usuario = buscarUsuario(id);
        usuario.setCuentaActiva(true);
        return toAdminUser(registerRepository.save(usuario));
    }

    @Transactional
    public Map<String, Object> aprobarColaborador(Long id, Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);

        Register colaborador = buscarUsuario(id);
        Login login = buscarLogin(colaborador);

        if (login.getRole() != Role.COLABORADOR) {
            throw new IllegalArgumentException("El usuario no es un colaborador");
        }

        login.setAprobado(true);
        colaborador.setCuentaActiva(true);

        loginRepository.save(login);
        return toAdminUser(registerRepository.save(colaborador));
    }

    @Transactional
    public Map<String, Object> rechazarColaborador(Long id, Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);

        Register colaborador = buscarUsuario(id);
        Login login = buscarLogin(colaborador);

        if (login.getRole() != Role.COLABORADOR) {
            throw new IllegalArgumentException("El usuario no es un colaborador");
        }

        login.setAprobado(false);
        colaborador.setCuentaActiva(false);

        loginRepository.save(login);
        return toAdminUser(registerRepository.save(colaborador));
    }

    @Transactional
    public Map<String, Object> restablecerContrasena(Long id, Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);
        validarNoEsAdminActual(id, adminId, "No puedes restablecer tu propia contraseña desde el panel administrativo");

        Register usuario = buscarUsuario(id);
        Login login = loginRepository.findByUsuario(usuario.getUsuario())
                .orElseThrow(() -> new IllegalStateException("No se encontró la cuenta de acceso asociada al usuario"));

        String contrasenaTemporal = generarContrasenaTemporal();
        String contrasenaEncriptada = passwordEncoder.encode(contrasenaTemporal);
        usuario.setContrasena(contrasenaEncriptada);
        login.setContrasena(contrasenaEncriptada);

        registerRepository.save(usuario);
        loginRepository.save(login);

        return Map.of(
                "mensaje", "Contraseña restablecida correctamente. Entrega la contraseña temporal al usuario por un canal seguro.",
                "contrasenaTemporal", contrasenaTemporal,
                "usuario", toAdminUser(usuario)
        );
    }

    @Transactional
    public void eliminarUsuario(Long id, Long adminId, String rolSolicitante) {
        validarAdmin(adminId, rolSolicitante);
        validarNoEsAdminActual(id, adminId, "No puedes eliminar tu propia cuenta administrativa");

        Register usuario = buscarUsuario(id);
        if (obtenerRol(usuario) == Role.ADMIN) {
            throw new IllegalArgumentException("No se puede eliminar una cuenta con rol ADMIN desde esta acción");
        }

        loginRepository.deleteByUsuario(usuario.getUsuario());
        registerRepository.delete(usuario);
    }

    public void validarAdmin(Long adminId, String rolSolicitante) {
        if (adminId == null || rolSolicitante == null || !"ADMIN".equalsIgnoreCase(rolSolicitante)) {
            throw new IllegalArgumentException("Solo una cuenta ADMIN puede realizar esta acción");
        }

        Register admin = buscarUsuario(adminId);
        Login loginAdmin = loginRepository.findByUsuario(admin.getUsuario())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró la cuenta administrativa"));

        if (loginAdmin.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Solo una cuenta ADMIN puede realizar esta acción");
        }
        if (!admin.isCuentaActiva()) {
            throw new IllegalArgumentException("La cuenta administrativa no está activa");
        }
    }

    private void validarNoEsAdminActual(Long usuarioId, Long adminId, String mensaje) {
        if (usuarioId != null && usuarioId.equals(adminId)) {
            throw new IllegalArgumentException(mensaje);
        }
    }

    private Register buscarUsuario(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Usuario no válido");
        }
        return registerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private Role obtenerRol(Register usuario) {
        return loginRepository.findByUsuario(usuario.getUsuario())
                .map(Login::getRole)
                .orElse(Role.CLIENTE);
    }

    private boolean obtenerAprobado(Register usuario) {
        return loginRepository.findByUsuario(usuario.getUsuario())
                .map(Login::isAprobado)
                .orElse(true);
    }

    private Login buscarLogin(Register usuario) {
        return loginRepository.findByUsuario(usuario.getUsuario())
                .orElseThrow(() -> new IllegalArgumentException("No se encontro la cuenta de acceso asociada"));
    }

    private Map<String, Object> toAdminUser(Register usuario) {
        return Map.ofEntries(
                Map.entry("id", usuario.getId()),
                Map.entry("usuario", usuario.getUsuario()),
                Map.entry("nombre", usuario.getNombre()),
                Map.entry("correo", usuario.getCorreo()),
                Map.entry("telefono", usuario.getTelefono() == null ? "" : usuario.getTelefono()),
                Map.entry("rol", obtenerRol(usuario).name()),
                Map.entry("aprobado", obtenerAprobado(usuario)),
                Map.entry("cuentaActiva", usuario.isCuentaActiva()),
                Map.entry("estadoCuenta", usuario.isCuentaActiva() ? "Activa" : "Suspendida"),
                Map.entry("fotoPerfil", usuario.getFotoPerfil() == null ? "" : usuario.getFotoPerfil()),
                Map.entry("descripcion", usuario.getDescripcion() == null ? "" : usuario.getDescripcion()),
                Map.entry("estaEnCasa", usuario.isEstaEnCasa()),
                Map.entry("hogarActual", usuario.getHogarActual() == null ? "" : usuario.getHogarActual())
        );
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
