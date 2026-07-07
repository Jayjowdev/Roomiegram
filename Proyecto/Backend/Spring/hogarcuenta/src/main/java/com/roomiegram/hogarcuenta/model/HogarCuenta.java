package com.roomiegram.hogarcuenta.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "hogar_cuenta")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class HogarCuenta {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "creado_por_id", nullable = true)
    private Long creadoPorId;

    @JsonManagedReference
    @OneToMany(mappedBy = "hogarCuenta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CuentaDeudor> deudores = new ArrayList<>();

    public BigDecimal getMontoPorPersona() {
        if (deudores == null || deudores.isEmpty() || monto == null) {
            return BigDecimal.ZERO;
        }

        return monto.divide(BigDecimal.valueOf(deudores.size()), 2, RoundingMode.HALF_UP);
    }

    public void agregarDeudor(Long usuarioId) {
        CuentaDeudor deudor = new CuentaDeudor();
        deudor.setUsuarioId(usuarioId);
        deudor.setHogarCuenta(this);
        deudores.add(deudor);
        recalcularMontosDeudores();
    }

    public void recalcularMontosDeudores() {
        BigDecimal montoPorPersona = getMontoPorPersona();

        for (CuentaDeudor deudor : deudores) {
            deudor.setMontoAdeudado(montoPorPersona);
        }
    }
}
