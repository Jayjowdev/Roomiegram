package com.roomiegram.publicacion.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.publicacion.model.Historia;
import com.roomiegram.publicacion.model.HistoriaRequest;
import com.roomiegram.publicacion.model.ModeracionRequest;
import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.model.PublicacionConHogarRequest;
import com.roomiegram.publicacion.model.PublicacionConHogarResponse;
import com.roomiegram.publicacion.service.HistoriaService;
import com.roomiegram.publicacion.service.PublicacionService;

@RestController
@RequestMapping("/publicaciones")
public class PublicacionController {

    @Autowired
    private PublicacionService publicacionService;

    @Autowired
    private HistoriaService historiaService;

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

    @GetMapping("/moderacion")
    public ResponseEntity<?> listarPublicacionesModeracion(@RequestParam Long moderadorId) {
        try {
            return ResponseEntity.ok(publicacionService.listarPublicacionesModeracion(moderadorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/moderacion/ocultar")
    public ResponseEntity<?> ocultarPublicacion(
            @PathVariable Long id,
            @RequestBody ModeracionRequest request) {
        try {
            Publicacion resultado = publicacionService.ocultarPublicacion(id, request);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return publicacionNoExiste(e)
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage())
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/moderacion/restaurar")
    public ResponseEntity<?> restaurarPublicacion(
            @PathVariable Long id,
            @RequestBody ModeracionRequest request) {
        try {
            Publicacion resultado = publicacionService.restaurarPublicacion(id, request);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return publicacionNoExiste(e)
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage())
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/historias")
    public ResponseEntity<List<Historia>> listarHistorias() {
        return ResponseEntity.ok(historiaService.listarHistorias());
    }

    @PostMapping("/historias")
    public ResponseEntity<?> crearHistoria(@RequestBody HistoriaRequest request) {
        try {
            Historia resultado = historiaService.crearHistoria(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/historias/{id}")
    public ResponseEntity<?> actualizarHistoria(
            @PathVariable Long id,
            @RequestBody HistoriaRequest request,
            @RequestParam String usuarioSolicitante,
            @RequestParam String rolSolicitante) {
        try {
            Historia resultado = historiaService.actualizarHistoria(id, request, usuarioSolicitante, rolSolicitante);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @DeleteMapping("/historias/{id}")
    public ResponseEntity<?> eliminarHistoria(
            @PathVariable Long id,
            @RequestParam String usuarioSolicitante,
            @RequestParam String rolSolicitante) {
        try {
            historiaService.eliminarHistoria(id, usuarioSolicitante, rolSolicitante);
            return ResponseEntity.ok("Historia eliminada correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPublicacion(
            @PathVariable Long id,
            @RequestBody Publicacion publicacion,
            @RequestParam String usuarioSolicitante,
            @RequestParam String rolSolicitante) {
        try {
            Publicacion resultado = publicacionService.actualizarPublicacion(
                    id, publicacion, usuarioSolicitante, rolSolicitante);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
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

    private boolean publicacionNoExiste(IllegalArgumentException e) {
        return e.getMessage() != null && e.getMessage().toLowerCase().contains("no existe");
    }
}
