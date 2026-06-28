package com.roomiegram.hogar.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.roomiegram.hogar.dto.AdminActionRequest;
import com.roomiegram.hogar.dto.CreateHogarRequest;
import com.roomiegram.hogar.dto.RecursoHogarRequest;
import com.roomiegram.hogar.dto.UsuarioRequest;
import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.service.HogarService;

@RestController
@RequestMapping("/hogares")
public class HogarController {

    private final HogarService hogarService;

    public HogarController(HogarService hogarService) {
        this.hogarService = hogarService;
    }

    @PostMapping
    public ResponseEntity<?> crearHogar(@RequestBody CreateHogarRequest request) {
        try {
            Hogar hogar = hogarService.crearHogar(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(hogar);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public List<Hogar> listarHogares() {
        return hogarService.listarHogares();
    }

    @GetMapping("/{id}")
    public Hogar obtenerPorId(@PathVariable Long id) {
        try {
            return hogarService.obtenerPorId(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/{id}/solicitudes")
    public ResponseEntity<?> solicitarIngreso(@PathVariable Long id, @RequestBody UsuarioRequest request) {
        try {
            return ResponseEntity.ok(hogarService.solicitarIngreso(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/solicitudes/{usuarioId}/aprobar")
    public ResponseEntity<?> aprobarSolicitud(
            @PathVariable Long id,
            @PathVariable Long usuarioId,
            @RequestBody AdminActionRequest request) {
        try {
            return ResponseEntity.ok(hogarService.aprobarSolicitud(id, usuarioId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/solicitudes/{usuarioId}/rechazar")
    public ResponseEntity<?> rechazarSolicitud(
            @PathVariable Long id,
            @PathVariable Long usuarioId,
            @RequestBody AdminActionRequest request) {
        try {
            return ResponseEntity.ok(hogarService.rechazarSolicitud(id, usuarioId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/integrantes/{usuarioId}")
    public ResponseEntity<?> removerIntegrante(
            @PathVariable Long id,
            @PathVariable Long usuarioId,
            @RequestParam(required = false) Long administradorId,
            @RequestParam(required = false) Long solicitanteId) {
        try {
            Long solicitante = solicitanteId != null ? solicitanteId : administradorId;
            return ResponseEntity.ok(hogarService.removerIntegrante(id, usuarioId, solicitante));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/tareas")
    public ResponseEntity<?> agregarTarea(@PathVariable Long id, @RequestBody RecursoHogarRequest request) {
        return responderAsociacion(() -> hogarService.agregarTarea(id, request));
    }

    @PostMapping("/{id}/cuentas")
    public ResponseEntity<?> agregarCuenta(@PathVariable Long id, @RequestBody RecursoHogarRequest request) {
        return responderAsociacion(() -> hogarService.agregarCuenta(id, request));
    }

    @PostMapping("/{id}/comprobantes")
    public ResponseEntity<?> agregarComprobante(@PathVariable Long id, @RequestBody RecursoHogarRequest request) {
        return responderAsociacion(() -> hogarService.agregarComprobante(id, request));
    }

    @PostMapping("/{id}/publicaciones")
    public ResponseEntity<?> agregarPublicacion(@PathVariable Long id, @RequestBody RecursoHogarRequest request) {
        return responderAsociacion(() -> hogarService.agregarPublicacion(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarHogar(
            @PathVariable Long id,
            @RequestParam(required = false) Long administradorId,
            @RequestParam(required = false) String rolSolicitante) {
        try {
            hogarService.eliminarHogar(id, administradorId, rolSolicitante);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    private ResponseEntity<?> responderAsociacion(HogarSupplier supplier) {
        try {
            return ResponseEntity.ok(supplier.get());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @FunctionalInterface
    private interface HogarSupplier {
        Hogar get();
    }
}
