package com.roomiegram.usuario.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.usuario.model.Register;

public interface RegisterRepository extends JpaRepository<Register, Long> {

    boolean existsByUsuario(String usuario);

    boolean existsByCorreo(String correo);

    Optional<Register> findByUsuario(String usuario);

}
