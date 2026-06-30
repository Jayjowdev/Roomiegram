package com.roomiegram.usuario.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.service.AdminUserService;

@RestController
@RequestMapping("/auth/admin/usuarios")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<?> listarUsuarios() {
        return ResponseEntity.ok(adminUserService.listarUsuarios());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminUserService.obtenerUsuario(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @GetMapping("/colaboradores/pendientes")
    public ResponseEntity<?> listarColaboradoresPendientes(
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            return ResponseEntity.ok(adminUserService.listarColaboradoresPendientes(adminId, rolSolicitante));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PatchMapping("/colaboradores/{id}/aprobar")
    public ResponseEntity<?> aprobarColaborador(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            return ResponseEntity.ok(adminUserService.aprobarColaborador(id, adminId, rolSolicitante));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PatchMapping("/colaboradores/{id}/rechazar")
    public ResponseEntity<?> rechazarColaborador(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            return ResponseEntity.ok(adminUserService.rechazarColaborador(id, adminId, rolSolicitante));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/suspender")
    public ResponseEntity<?> suspenderUsuario(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            return ResponseEntity.ok(adminUserService.suspenderUsuario(id, adminId, rolSolicitante));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivarUsuario(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            return ResponseEntity.ok(adminUserService.reactivarUsuario(id, adminId, rolSolicitante));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/{id}/restablecer-contrasena")
    public ResponseEntity<?> restablecerContrasena(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            return ResponseEntity.ok(adminUserService.restablecerContrasena(id, adminId, rolSolicitante));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam String rolSolicitante) {
        try {
            adminUserService.eliminarUsuario(id, adminId, rolSolicitante);
            return ResponseEntity.ok(Map.of("mensaje", "Usuario eliminado correctamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }
}
