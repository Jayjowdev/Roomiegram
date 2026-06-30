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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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

    @Column(name = "cuenta_activa", nullable = false)
    private Boolean cuentaActiva = true;

    @Column(name = "cuenta_suspendida", nullable = false)
    private Boolean cuentaSuspendida = false;

    public Boolean getCuentaActiva() {
        return cuentaActiva == null ? Boolean.TRUE : cuentaActiva;
    }

    public void setCuentaActiva(Boolean cuentaActiva) {
        this.cuentaActiva = cuentaActiva == null ? Boolean.TRUE : cuentaActiva;
        this.cuentaSuspendida = !this.cuentaActiva;
    }

    public boolean isCuentaActiva() {
        return Boolean.TRUE.equals(getCuentaActiva());
    }

    public Boolean getCuentaSuspendida() {
        return !isCuentaActiva();
    }

    public void setCuentaSuspendida(Boolean cuentaSuspendida) {
        boolean suspendida = Boolean.TRUE.equals(cuentaSuspendida);
        this.cuentaSuspendida = suspendida;
        this.cuentaActiva = !suspendida;
    }

    @PrePersist
    @PreUpdate
    private void sincronizarEstadoCuenta() {
        if (cuentaActiva == null) {
            cuentaActiva = true;
        }
        cuentaSuspendida = !cuentaActiva;
    }
}
