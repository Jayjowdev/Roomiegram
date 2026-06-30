package com.roomiegram.usuario.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.roomiegram.usuario.enums.Role;
import com.roomiegram.usuario.model.Login;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.LoginRepository;
import com.roomiegram.usuario.repository.RegisterRepository;

@Configuration
public class LoadDatabase {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Bean
    CommandLineRunner initDatabase(RegisterRepository registerRepository, LoginRepository loginRepository) {
        return args -> {
            boolean baseVacia = registerRepository.count() == 0;
            asegurarAdmin(registerRepository, loginRepository);

            if (baseVacia && !registerRepository.existsByUsuario("juanperez")) {
                Register cliente = new Register();
                cliente.setNombre("Juan Perez");
                cliente.setCorreo("juan@example.com");
                cliente.setUsuario("juanperez");
                cliente.setContrasena(passwordEncoder.encode("password123"));
                cliente.setTelefono("9876543210");
                cliente.setCuentaActiva(true);
                registerRepository.save(cliente);

                Login loginCliente = new Login();
                loginCliente.setUsuario("juanperez");
                loginCliente.setContrasena(passwordEncoder.encode("password123"));
                loginCliente.setRole(Role.CLIENTE);
                loginRepository.save(loginCliente);

                System.out.println("Base de datos inicializada con usuarios de prueba:");
                System.out.println("Admin - Usuario: admin, Contrasena: admin123");
                System.out.println("Cliente - Usuario: juanperez, Contrasena: password123");
            } else {
                System.out.println("La base de datos ya contiene datos.");
            }
        };
    }

    private void asegurarAdmin(RegisterRepository registerRepository, LoginRepository loginRepository) {
        if (!registerRepository.existsByUsuario("admin")) {
            Register admin = new Register();
            admin.setNombre("Administrador");
            admin.setCorreo("admin@example.com");
            admin.setUsuario("admin");
            admin.setContrasena(passwordEncoder.encode("admin123"));
            admin.setTelefono("1234567890");
            admin.setCuentaActiva(true);
            registerRepository.save(admin);
        }

        if (!loginRepository.existsByUsuario("admin")) {
            Login loginAdmin = new Login();
            loginAdmin.setUsuario("admin");
            loginAdmin.setContrasena(passwordEncoder.encode("admin123"));
            loginAdmin.setRole(Role.ADMIN);
            loginRepository.save(loginAdmin);
        }
    }
}
