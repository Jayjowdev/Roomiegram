package com.roomiegram.usuario.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.enums.Plan;
import com.roomiegram.usuario.model.Suscripcion;
import com.roomiegram.usuario.service.AdminUserService;
import com.roomiegram.usuario.service.MercadoPagoService;
import com.roomiegram.usuario.service.MercadoPagoService.ResultadoPago;
import com.roomiegram.usuario.service.MembresiaService;

@RestController
@RequestMapping("/auth/membresias")
public class MembresiaController {

    private final MembresiaService membresiaService;
    private final MercadoPagoService mercadoPagoService;
    private final AdminUserService adminUserService;

    @Value("${pagos.demo-enabled:false}")
    private boolean pagosDemoEnabled;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public MembresiaController(MembresiaService membresiaService, MercadoPagoService mercadoPagoService, AdminUserService adminUserService) {
        this.membresiaService = membresiaService;
        this.mercadoPagoService = mercadoPagoService;
        this.adminUserService = adminUserService;
    }

    @GetMapping("/planes")
    public ResponseEntity<List<Map<String, Object>>> listarPlanes() {
        return ResponseEntity.ok(membresiaService.obtenerPlanes());
    }

    @GetMapping("/demo/estado")
    public ResponseEntity<Map<String, Object>> obtenerEstadoDemo() {
        boolean entornoLocal = esFrontendLocal();
        boolean habilitado = pagosDemoEnabled && entornoLocal;
        String mensaje = habilitado
                ? "Modo demo local habilitado para probar membresías sin pago real"
                : "Modo demo deshabilitado. Activa PAGOS_DEMO_ENABLED=true y usa APP_FRONTEND_URL local";

        return ResponseEntity.ok(Map.of(
                "habilitado", habilitado,
                "demoEnabled", pagosDemoEnabled,
                "entornoLocal", entornoLocal,
                "mensaje", mensaje));
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

            if (plan != Plan.GRATIS) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("mensaje", "Los planes premium se activan solo después de confirmar el pago"));
            }

            Suscripcion suscripcion = membresiaService.suscribir(usuarioId, plan, renovacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(suscripcion);
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", "No se pudo procesar la suscripción"));
        }
    }

    @PostMapping("/demo/suscribir")
    public ResponseEntity<?> suscribirDemo(@RequestBody Map<String, Object> body) {
        if (!demoHabilitado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "mensaje",
                    "El modo demo de pagos está deshabilitado. Debe usarse solo con PAGOS_DEMO_ENABLED=true y APP_FRONTEND_URL local"));
        }

        try {
            Long usuarioId = Long.valueOf(body.get("usuarioId").toString());
            Plan plan = Plan.valueOf(body.get("plan").toString());
            Suscripcion suscripcion = membresiaService.suscribir(usuarioId, plan, plan != Plan.GRATIS);
            return ResponseEntity.status(HttpStatus.CREATED).body(suscripcion);
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", "No se pudo activar el plan demo solicitado"));
        }
    }

    @PatchMapping("/admin/usuario/{usuarioId}/plan")
    public ResponseEntity<?> cambiarPlanComoAdmin(@PathVariable Long usuarioId, @RequestBody Map<String, Object> body) {
        try {
            Long adminId = Long.valueOf(body.get("adminId").toString());
            String rolSolicitante = body.get("rolSolicitante").toString();
            Plan plan = Plan.valueOf(body.get("plan").toString());
            boolean renovacion = Boolean.parseBoolean(body.getOrDefault("renovacionAutomatica", plan != Plan.GRATIS).toString());

            adminUserService.validarAdmin(adminId, rolSolicitante);
            membresiaService.suscribir(usuarioId, plan, renovacion);
            return ResponseEntity.ok(membresiaService.obtenerActiva(usuarioId));
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", e.getMessage() == null ? "No se pudo actualizar el plan del usuario" : e.getMessage()));
        }
    }

    @DeleteMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> cancelar(@PathVariable Long usuarioId) {
        try {
            membresiaService.cancelar(usuarioId);
            return ResponseEntity.ok(Map.of("mensaje", "Suscripción cancelada correctamente"));
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
    public ResponseEntity<?> verificarPago(
            @RequestParam String externalReference,
            @RequestParam(required = false) Long paymentId,
            @RequestParam(required = false, name = "collection_id") Long collectionId) {
        Long idPago = paymentId != null ? paymentId : collectionId;
        ResultadoPago resultado = mercadoPagoService.verificarPago(externalReference, idPago);
        return ResponseEntity.ok(Map.of(
                "aprobado", resultado.aprobado(),
                "estado", resultado.estado(),
                "mensaje", resultado.mensaje()));
    }

    private boolean demoHabilitado() {
        return pagosDemoEnabled && esFrontendLocal();
    }

    private boolean esFrontendLocal() {
        String url = frontendUrl == null ? "" : frontendUrl.trim();
        return url.startsWith("http://localhost")
                || url.startsWith("http://127.0.0.1")
                || url.startsWith("http://[::1]");
    }
}
