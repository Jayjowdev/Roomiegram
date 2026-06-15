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
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.enums.Plan;
import com.roomiegram.usuario.model.Suscripcion;
import com.roomiegram.usuario.service.MembresiaService;

@RestController
@RequestMapping("/membresias")
public class MembresiaController {

    private final MembresiaService membresiaService;

    public MembresiaController(MembresiaService membresiaService) {
        this.membresiaService = membresiaService;
    }

    /** GET /membresias/planes — listado publico de planes disponibles */
    @GetMapping("/planes")
    public ResponseEntity<List<Map<String, Object>>> listarPlanes() {
        return ResponseEntity.ok(membresiaService.obtenerPlanes());
    }

    /** GET /membresias/usuario/{usuarioId} — suscripcion activa del usuario */
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> obtenerActiva(@PathVariable Long usuarioId) {
        try {
            Suscripcion suscripcion = membresiaService.obtenerActiva(usuarioId);
            return ResponseEntity.ok(suscripcion);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensaje", "Error al obtener la suscripcion"));
        }
    }

    /** GET /membresias/usuario/{usuarioId}/historial — historial completo del usuario */
    @GetMapping("/usuario/{usuarioId}/historial")
    public ResponseEntity<List<Suscripcion>> historial(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(membresiaService.historial(usuarioId));
    }

    /**
     * POST /membresias/suscribir — suscribe al usuario a un plan.
     * Body: { "usuarioId": 1, "plan": "PREMIUM_INDIVIDUAL", "renovacionAutomatica": true }
     */
    @PostMapping("/suscribir")
    public ResponseEntity<?> suscribir(@RequestBody Map<String, Object> body) {
        try {
            Long usuarioId = Long.valueOf(body.get("usuarioId").toString());
            Plan plan = Plan.valueOf(body.get("plan").toString());
            boolean renovacion = Boolean.parseBoolean(body.getOrDefault("renovacionAutomatica", "false").toString());

            Suscripcion suscripcion = membresiaService.suscribir(usuarioId, plan, renovacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(suscripcion);
        } catch (IllegalArgumentException | NullPointerException e) {
            String msg = e instanceof NullPointerException
                    ? "Campos obligatorios ausentes en el cuerpo de la peticion"
                    : e.getMessage();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", msg));
        }
    }

    /** DELETE /membresias/usuario/{usuarioId} — cancela la suscripcion activa */
    @DeleteMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> cancelar(@PathVariable Long usuarioId) {
        membresiaService.cancelar(usuarioId);
        return ResponseEntity.ok(Map.of("mensaje", "Suscripcion cancelada correctamente"));
    }
}
