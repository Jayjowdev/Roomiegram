package com.roomiegram.usuario.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.model.ResenaRoomie;
import com.roomiegram.usuario.service.ResenaRoomieService;

@RestController
@RequestMapping("/auth/resenas")
public class ResenaRoomieController {

    private final ResenaRoomieService resenaRoomieService;

    public ResenaRoomieController(ResenaRoomieService resenaRoomieService) {
        this.resenaRoomieService = resenaRoomieService;
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> obtenerPorUsuario(@PathVariable Long usuarioId) {
        try {
            List<ResenaRoomie> resenas = resenaRoomieService.obtenerPorUsuario(usuarioId);
            return ResponseEntity.ok(resenas);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ResenaRoomie resena) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(resenaRoomieService.crear(resena));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", e.getMessage()));
        }
    }
}
