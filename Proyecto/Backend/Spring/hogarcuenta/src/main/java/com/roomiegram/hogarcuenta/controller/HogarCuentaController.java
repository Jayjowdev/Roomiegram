package com.roomiegram.hogarcuenta.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.roomiegram.hogarcuenta.model.HogarCuenta;
import com.roomiegram.hogarcuenta.service.HogarCuentaService;

@RestController
@RequestMapping("/hogar-cuentas")
public class HogarCuentaController {

    private final HogarCuentaService hogarCuentaService;

    public HogarCuentaController(HogarCuentaService hogarCuentaService) {
        this.hogarCuentaService = hogarCuentaService;
    }

    @PostMapping
    public ResponseEntity<HogarCuenta> crear(@RequestBody HogarCuenta hogarCuenta) {
        HogarCuenta cuentaGuardada = hogarCuentaService.guardarHogarCuenta(hogarCuenta);
        return ResponseEntity.status(HttpStatus.CREATED).body(cuentaGuardada);
    }

    @GetMapping
    public List<HogarCuenta> obtenerTodas() {
        return hogarCuentaService.obtenerTodas();
    }

    @GetMapping("/{id}")
    public HogarCuenta obtenerPorId(@PathVariable Long id) {
        return hogarCuentaService.obtenerPorId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta no encontrada"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (hogarCuentaService.obtenerPorId(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta no encontrada");
        }

        hogarCuentaService.eliminarHogarCuenta(id);
        return ResponseEntity.noContent().build();
    }
}
