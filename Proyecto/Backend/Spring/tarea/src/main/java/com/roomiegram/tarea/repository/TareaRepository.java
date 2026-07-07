package com.roomiegram.tarea.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roomiegram.tarea.model.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Long> {

    @Query("SELECT COUNT(t) FROM Tarea t WHERE t.creadoPorId = :creadoPorId AND t.fechaCreacion >= :inicioMes")
    long countByCreadoPorIdAndFechaCreacionGreaterThanEqual(
            @Param("creadoPorId") Long creadoPorId,
            @Param("inicioMes") LocalDate inicioMes);

}
