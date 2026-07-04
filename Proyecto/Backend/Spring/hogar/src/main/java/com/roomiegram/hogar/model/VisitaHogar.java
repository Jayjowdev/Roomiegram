package com.roomiegram.hogar.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "visitas_hogar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VisitaHogar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "publicacion_id", nullable = false)
    private Long publicacionId;

    @Column(name = "hogar_id", nullable = false)
    private Long hogarId;

    @Column(name = "interesado_id", nullable = false)
    private Long interesadoId;

    @Column(name = "anfitrion_id", nullable = false)
    private Long anfitrionId;

    @Column(name = "fecha_hora_propuesta", nullable = false)
    private LocalDateTime fechaHoraPropuesta;

    @Column(name = "fecha_hora_alternativa")
    private LocalDateTime fechaHoraAlternativa;

    @Column(length = 500)
    private String mensaje;

    @Column(name = "mensaje_alternativa", length = 500)
    private String mensajeAlternativa;

    @Column(name = "respuesta_anfitrion", length = 500)
    private String respuestaAnfitrion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoVisitaHogar estado = EstadoVisitaHogar.PENDIENTE;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        LocalDateTime ahora = LocalDateTime.now();
        if (fechaCreacion == null) {
            fechaCreacion = ahora;
        }
        if (fechaActualizacion == null) {
            fechaActualizacion = ahora;
        }
        if (estado == null) {
            estado = EstadoVisitaHogar.PENDIENTE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
