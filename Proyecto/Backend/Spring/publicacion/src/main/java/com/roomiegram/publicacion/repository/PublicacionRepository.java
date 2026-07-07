package com.roomiegram.publicacion.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.publicacion.model.Publicacion;

public interface PublicacionRepository extends JpaRepository<Publicacion, Long> {

    long countByUsuarioCreador(String usuarioCreador);

}
