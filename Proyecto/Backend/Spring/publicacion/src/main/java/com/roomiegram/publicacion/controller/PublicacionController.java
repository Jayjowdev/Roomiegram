package com.roomiegram.publicacion.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.model.PublicacionConHogarRequest;
import com.roomiegram.publicacion.model.PublicacionConHogarResponse;
import com.roomiegram.publicacion.service.PublicacionService;

@RestController
@RequestMapping("/publicaciones")
@CrossOrigin(origins = "*")
public class PublicacionController {

    @Autowired
    private PublicacionService publicacionService;

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarPublicacion(@RequestBody Publicacion publicacion) {
        try {
            Publicacion resultado = publicacionService.guardarPublicacion(publicacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/guardar-con-hogar")
    public ResponseEntity<?> guardarPublicacionConHogar(@RequestBody PublicacionConHogarRequest request) {
        try {
            PublicacionConHogarResponse resultado = publicacionService.guardarPublicacionConHogar(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/listar")
    public ResponseEntity<List<Publicacion>> listarPublicaciones() {
        return ResponseEntity.ok(publicacionService.listarPublicaciones());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPublicacion(
            @PathVariable Long id,
            @RequestParam String usuarioSolicitante,
            @RequestParam String rolSolicitante) {
        try {
            publicacionService.eliminarPublicacion(id, usuarioSolicitante, rolSolicitante);
            return ResponseEntity.ok("Publicación eliminada correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}