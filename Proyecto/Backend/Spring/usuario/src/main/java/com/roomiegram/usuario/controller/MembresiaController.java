package com.roomiegram.usuario.controller;

import java.util.List;
import java.util.Map;

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

import com.roomiegram.usuario.enums.Plan;
import com.roomiegram.usuario.model.Suscripcion;
import com.roomiegram.usuario.service.MercadoPagoService;
import com.roomiegram.usuario.service.MembresiaService;

@RestController
@RequestMapping("/auth/membresias")
public class MembresiaController {

    private final MembresiaService membresiaService;
    private final MercadoPagoService mercadoPagoService;

    public MembresiaController(MembresiaService membresiaService, MercadoPagoService mercadoPagoService) {
        this.membresiaService = membresiaService;
        this.mercadoPagoService = mercadoPagoService;
    }

    @GetMapping("/planes")
    public ResponseEntity<List<Map<String, Object>>> listarPlanes() {
        return ResponseEntity.ok(membresiaService.obtenerPlanes());
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> obtenerActiva(@PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(membresiaService.obtenerActiva(usuarioId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @GetMapping("/usuario/{usuarioId}/historial")
    public ResponseEntity<?> historial(@PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(membresiaService.historial(usuarioId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/suscribir")
    public ResponseEntity<?> suscribir(@RequestBody Map<String, Object> body) {
        try {
            Long usuarioId = Long.valueOf(body.get("usuarioId").toString());
            Plan plan = Plan.valueOf(body.get("plan").toString());
            boolean renovacion = Boolean.parseBoolean(body.getOrDefault("renovacionAutomatica", "false").toString());

            Suscripcion suscripcion = membresiaService.suscribir(usuarioId, plan, renovacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(suscripcion);
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", "No se pudo procesar la suscripcion"));
        }
    }

    @DeleteMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> cancelar(@PathVariable Long usuarioId) {
        try {
            membresiaService.cancelar(usuarioId);
            return ResponseEntity.ok(Map.of("mensaje", "Suscripcion cancelada correctamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/crear-preferencia")
    public ResponseEntity<?> crearPreferenciaPago(@RequestBody Map<String, Object> body) {
        try {
            Long usuarioId = Long.valueOf(body.get("usuarioId").toString());
            Plan plan = Plan.valueOf(body.get("plan").toString());
            Map<String, String> preferencia = mercadoPagoService.crearPreferenciaPago(usuarioId, plan);
            return ResponseEntity.ok(preferencia);
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @GetMapping("/verificar-pago")
    public ResponseEntity<?> verificarPago(@RequestParam String externalReference) {
        boolean aprobado = mercadoPagoService.verificarPagoAprobado(externalReference);
        return ResponseEntity.ok(Map.of(
                "aprobado", aprobado,
                "mensaje", aprobado ? "Pago confirmado" : "Pago no confirmado"));
    }
}
