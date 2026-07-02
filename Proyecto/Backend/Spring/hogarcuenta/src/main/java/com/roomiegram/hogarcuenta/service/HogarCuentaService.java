package com.roomiegram.hogarcuenta.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.roomiegram.hogarcuenta.model.CuentaDeudor;
import com.roomiegram.hogarcuenta.model.CategoriaGasto;
import com.roomiegram.hogarcuenta.model.EstadoGasto;
import com.roomiegram.hogarcuenta.model.HogarCuenta;
import com.roomiegram.hogarcuenta.repository.HogarCuentaRepository;

@Service
public class HogarCuentaService {
    @Autowired
    private HogarCuentaRepository hogarCuentaRepository;

    public HogarCuenta guardarHogarCuenta(HogarCuenta hogarCuenta) {
        validarHogarCuenta(hogarCuenta);
        completarDatosPorDefecto(hogarCuenta);
        prepararRelacionDeudores(hogarCuenta);
        hogarCuenta.recalcularMontosDeudores();

        return hogarCuentaRepository.save(hogarCuenta);
    }

    public List<HogarCuenta> obtenerTodas() {
        return hogarCuentaRepository.findAll();
    }

    public Optional<HogarCuenta> obtenerPorId(Long id) {
        return hogarCuentaRepository.findById(id);
    }

    public void eliminarHogarCuenta(Long id) {
        hogarCuentaRepository.deleteById(id);
    }

    private void validarHogarCuenta(HogarCuenta hogarCuenta) {
        if (hogarCuenta == null) {
            throw new IllegalArgumentException("La cuenta es obligatoria");
        }

        if (hogarCuenta.getDescripcion() == null || hogarCuenta.getDescripcion().isBlank()) {
            throw new IllegalArgumentException("La descripcion es obligatoria");
        }

        if (hogarCuenta.getMonto() == null || hogarCuenta.getMonto().signum() <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor a 0");
        }

        if (hogarCuenta.getDeudores() == null || hogarCuenta.getDeudores().isEmpty()) {
            throw new IllegalArgumentException("Debe existir al menos un deudor");
        }
    }

    private void completarDatosPorDefecto(HogarCuenta hogarCuenta) {
        hogarCuenta.setCategoria(hogarCuenta.getCategoria() == null ? CategoriaGasto.OTRO : hogarCuenta.getCategoria());
        hogarCuenta.setEstado(hogarCuenta.getEstado() == null ? EstadoGasto.PENDIENTE : hogarCuenta.getEstado());

        if (hogarCuenta.getPeriodo() != null) {
            hogarCuenta.setPeriodo(hogarCuenta.getPeriodo().trim());
        }
    }

    private void prepararRelacionDeudores(HogarCuenta hogarCuenta) {
        if (hogarCuenta.getDeudores() == null) {
            return;
        }

        for (CuentaDeudor deudor : hogarCuenta.getDeudores()) {
            deudor.setHogarCuenta(hogarCuenta);
        }
    }
}
