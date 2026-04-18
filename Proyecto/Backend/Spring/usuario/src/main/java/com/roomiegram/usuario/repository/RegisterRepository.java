package com.roomiegram.usuario.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.usuario.model.Register;

public interface RegisterRepository extends JpaRepository<Register, Long> {

    boolean existsByUsuario(String usuario);

    boolean existsByCorreo(String correo);

}
