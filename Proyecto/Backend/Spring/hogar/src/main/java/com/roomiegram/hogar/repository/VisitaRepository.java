package com.roomiegram.hogar.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.roomiegram.hogar.model.EstadoVisita;
import com.roomiegram.hogar.model.Visita;

@Repository
public interface VisitaRepository extends JpaRepository<Visita, Long> {

    List<Visita> findByHogarIdOrderByFechaVisitaDesc(Long hogarId);

    List<Visita> findByUsuarioVisitanteIdOrderByFechaVisitaDesc(Long usuarioVisitanteId);

    List<Visita> findByHogarIdAndUsuarioVisitanteIdOrderByFechaVisitaDesc(Long hogarId, Long usuarioVisitanteId);

    boolean existsByHogarIdAndUsuarioVisitanteIdAndEstado(Long hogarId, Long usuarioVisitanteId, EstadoVisita estado);
}
