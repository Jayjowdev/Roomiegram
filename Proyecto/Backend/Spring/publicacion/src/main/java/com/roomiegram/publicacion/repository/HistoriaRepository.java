package com.roomiegram.publicacion.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.publicacion.model.Historia;

public interface HistoriaRepository extends JpaRepository<Historia, Long> {
    List<Historia> findAllByOrderByFechaCreacionDesc();
}
