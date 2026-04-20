package com.roomiegram.tarea.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.tarea.model.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Long> {

}
