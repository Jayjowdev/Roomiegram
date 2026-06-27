package com.roomiegram.publicacion.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "publicacion")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Publicacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String usuarioCreador;

    @Column(nullable = false, length = 300)
    private String titulo;

    @Column(nullable = false, length = 500)
    private String ubicacion;

    @Column(nullable = false, length = 5000)
    private String descripcion;

    @Column(length = 30)
    private String tipo;

    @Column(nullable = false)
    private Double precio;

    @Column(nullable = false)
    private int numeroHabitaciones;

    @Column(nullable = false)
    private int numeroPersonas;

    @Column(nullable = false)
    private int numeroBanos;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imagen;

    @ElementCollection(fetch = FetchType.EAGER)
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private List<String> galeria = new ArrayList<>();

}
