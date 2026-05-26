package com.roomiegram.usuario.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor

public class Register {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;
    
    @Column(length = 100)
    private String apellido;

    @Column(nullable = false, length = 100)
    private String correo;

    @Column(nullable = false, length = 100)
    private String usuario;

    @Column(nullable = false, length = 100)
    private String contrasena;

    @Column(nullable = false, length = 100)
    private String telefono;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String fotoPerfil;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String descripcion;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(length = 100)
    private List<String> intereses = new ArrayList<>();

    private boolean estaEnCasa = false;

    @Column(length = 150)
    private String hogarActual;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String preferenciasCompatibilidad;
}
