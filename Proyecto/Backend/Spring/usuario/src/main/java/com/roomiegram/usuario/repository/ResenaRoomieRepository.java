package com.roomiegram.usuario.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.usuario.model.ResenaRoomie;

public interface ResenaRoomieRepository extends JpaRepository<ResenaRoomie, Long> {
    List<ResenaRoomie> findByUsuarioEvaluadoIdOrderByFechaCreacionDesc(Long usuarioEvaluadoId);
}
