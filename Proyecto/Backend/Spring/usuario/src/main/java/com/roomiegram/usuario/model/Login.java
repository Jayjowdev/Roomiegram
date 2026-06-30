package com.roomiegram.usuario.model;

import com.roomiegram.usuario.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor

public class Login {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 100)
    String usuario;

    @Column(nullable = false, length = 100)
    String contrasena;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, columnDefinition = "VARCHAR(30)")
    private Role role;

    @Column(name = "aprobado", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean aprobado = true;

    public boolean isAprobado() {
        return aprobado == null ? true : aprobado;
    }

    public void setAprobado(Boolean aprobado) {
        this.aprobado = aprobado;
    }

}
