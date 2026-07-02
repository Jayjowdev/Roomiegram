package com.roomiegram.usuario.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.usuario.enums.EstadoSuscripcion;
import com.roomiegram.usuario.model.Suscripcion;

public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {
    Optional<Suscripcion> findTopByUsuarioIdAndEstadoOrderByFechaInicioDescIdDesc(Long usuarioId, EstadoSuscripcion estado);

    List<Suscripcion> findAllByUsuarioId(Long usuarioId);
}
