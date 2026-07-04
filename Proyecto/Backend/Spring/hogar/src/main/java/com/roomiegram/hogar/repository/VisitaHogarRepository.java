package com.roomiegram.hogar.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.hogar.model.EstadoVisitaHogar;
import com.roomiegram.hogar.model.VisitaHogar;

public interface VisitaHogarRepository extends JpaRepository<VisitaHogar, Long> {

    List<VisitaHogar> findByInteresadoIdOrAnfitrionIdOrderByFechaActualizacionDescFechaCreacionDesc(
            Long interesadoId,
            Long anfitrionId);

    List<VisitaHogar> findByHogarIdOrderByFechaActualizacionDescFechaCreacionDesc(Long hogarId);

    List<VisitaHogar> findByPublicacionIdAndInteresadoIdAndEstadoIn(
            Long publicacionId,
            Long interesadoId,
            Collection<EstadoVisitaHogar> estados);
}
