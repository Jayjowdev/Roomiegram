package com.roomiegram.publicacion.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicacionConHogarRequest {

    private String usuarioCreador;
    private Long usuarioId;
    private String titulo;
    private String ubicacion;
    private String descripcion;
    private Double precio;
    private int numeroHabitaciones;
    private int numeroPersonas;
    private int numeroBanos;
    private String imagen;
    private List<String> galeria;
}
