package com.roomiegram.usuario.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.usuario.model.Suscripcion;

public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {
    Optional<Suscripcion> findTopByUsuarioIdOrderByFechaInicioDesc(Long usuarioId);
    List<Suscripcion> findAllByUsuarioId(Long usuarioId);
}
