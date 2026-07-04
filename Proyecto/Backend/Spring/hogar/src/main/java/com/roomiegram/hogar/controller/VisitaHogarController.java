package com.roomiegram.hogar.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.hogar.dto.CrearVisitaRequest;
import com.roomiegram.hogar.dto.ProponerAlternativaVisitaRequest;
import com.roomiegram.hogar.dto.ResponderAlternativaVisitaRequest;
import com.roomiegram.hogar.dto.ResponderVisitaRequest;
import com.roomiegram.hogar.service.VisitaHogarService;

@RestController
@RequestMapping("/hogares")
public class VisitaHogarController {

    private final VisitaHogarService visitaHogarService;

    public VisitaHogarController(VisitaHogarService visitaHogarService) {
        this.visitaHogarService = visitaHogarService;
    }

    @PostMapping("/visitas")
    public ResponseEntity<?> crearVisita(@RequestBody CrearVisitaRequest request) {
        return responder(() -> ResponseEntity.status(HttpStatus.CREATED).body(visitaHogarService.crearVisita(request)));
    }

    @GetMapping("/visitas")
    public ResponseEntity<?> listarPorUsuario(@RequestParam Long usuarioId) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.listarPorUsuario(usuarioId)));
    }

    @GetMapping("/{hogarId}/visitas")
    public ResponseEntity<?> listarPorHogar(@PathVariable Long hogarId) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.listarPorHogar(hogarId)));
    }

    @GetMapping("/visitas/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.obtenerPorId(id)));
    }

    @PostMapping("/visitas/{id}/aceptar")
    public ResponseEntity<?> aceptar(@PathVariable Long id, @RequestBody ResponderVisitaRequest request) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.aceptarVisita(id, request)));
    }

    @PostMapping("/visitas/{id}/rechazar")
    public ResponseEntity<?> rechazar(@PathVariable Long id, @RequestBody ResponderVisitaRequest request) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.rechazarVisita(id, request)));
    }

    @PostMapping("/visitas/{id}/proponer-alternativa")
    public ResponseEntity<?> proponerAlternativa(
            @PathVariable Long id,
            @RequestBody ProponerAlternativaVisitaRequest request) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.proponerAlternativa(id, request)));
    }

    @PostMapping("/visitas/{id}/responder-alternativa")
    public ResponseEntity<?> responderAlternativa(
            @PathVariable Long id,
            @RequestBody ResponderAlternativaVisitaRequest request) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.responderAlternativa(id, request)));
    }

    @PostMapping("/visitas/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id, @RequestBody ResponderVisitaRequest request) {
        return responder(() -> ResponseEntity.ok(visitaHogarService.cancelarVisita(id, request)));
    }

    private ResponseEntity<?> responder(VisitaSupplier supplier) {
        try {
            return supplier.get();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @FunctionalInterface
    private interface VisitaSupplier {
        ResponseEntity<?> get();
    }
}
