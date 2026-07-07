package com.roomiegram.tarea.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tareas")
@Data
@AllArgsConstructor
@NoArgsConstructor

public class Tarea {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false, length = 100)
    private String encargado;

    @Column(nullable = false, length = 100)
    private String descripcion;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column
    private Boolean completada = false;

    @Column(name = "creado_por_id", nullable = true)
    private Long creadoPorId;

    @Column(name = "fecha_creacion", nullable = true)
    private LocalDate fechaCreacion;

}
