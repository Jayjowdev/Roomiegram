package com.roomiegram.tarea.controller;


import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.tarea.model.Tarea;
import com.roomiegram.tarea.service.TareaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/tareas")
public class TareaController {

    @Autowired
    private TareaService tareaService;

    @Operation(summary = "Guardar una nueva tarea", description = "Permite guardar una nueva tarea en el sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Tarea creada exitosamente",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tarea.class))),
        @ApiResponse(responseCode = "400", description = "Solicitud inválida", content = @Content)
    })

    @PostMapping("/guardar")
    public ResponseEntity<Tarea> guardarTarea(
            @Parameter(description = "Datos de la tarea a crear", required = true)
            @RequestBody Tarea  tarea){
        Tarea resultado = tareaService.guardarTarea(tarea);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }

    @Operation(summary = "Actualizar una tarea", description = "Permite editar los datos principales de una tarea existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarea actualizada exitosamente",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tarea.class))),
        @ApiResponse(responseCode = "400", description = "Solicitud invÃ¡lida", content = @Content),
        @ApiResponse(responseCode = "404", description = "Tarea no encontrada", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarTarea(
            @Parameter(description = "Id de la tarea a actualizar", required = true)
            @PathVariable Long id,
            @Parameter(description = "Datos actualizados de la tarea", required = true)
            @RequestBody Tarea tarea) {
        try {
            Tarea resultado = tareaService.actualizarTarea(id, tarea);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            HttpStatus status = "La tarea no existe".equals(e.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @Operation(summary = "Marcar tarea como completada", description = "Cambia el estado de una tarea existente a completada")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarea marcada como completada",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tarea.class))),
        @ApiResponse(responseCode = "404", description = "Tarea no encontrada", content = @Content)
    })
    @PatchMapping("/{id}/completar")
    public ResponseEntity<?> completarTarea(
            @Parameter(description = "Id de la tarea a completar", required = true)
            @PathVariable Long id) {
        return cambiarEstado(id, true);
    }

    @Operation(summary = "Marcar tarea como pendiente", description = "Cambia el estado de una tarea existente a pendiente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarea marcada como pendiente",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tarea.class))),
        @ApiResponse(responseCode = "404", description = "Tarea no encontrada", content = @Content)
    })
    @PatchMapping("/{id}/pendiente")
    public ResponseEntity<?> marcarPendiente(
            @Parameter(description = "Id de la tarea a marcar como pendiente", required = true)
            @PathVariable Long id) {
        return cambiarEstado(id, false);
    }

    @Operation(summary = "Eliminar una tarea", description = "Permite eliminar una tarea existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Tarea eliminada exitosamente", content = @Content),
        @ApiResponse(responseCode = "404", description = "Tarea no encontrada", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarTarea(
            @Parameter(description = "Id de la tarea a eliminar", required = true)
            @PathVariable Long id) {
        try {
            tareaService.eliminarTarea(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            HttpStatus status = "La tarea no existe".equals(e.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("mensaje", e.getMessage()));
        }
    }

    @Operation(summary = "Listar todas las tareas", 
               description = "Obtiene una lista completa de todas las tareas registradas")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista obtenida exitosamente",
                     content = @Content(mediaType = "application/json", 
                                      schema = @Schema(implementation = Tarea.class)))
    })
    
    @GetMapping("/listar")
    public ResponseEntity<List<Tarea>> listarTareas() {
        List<Tarea> tareas = tareaService.listarTareas();
        return ResponseEntity.ok(tareas);
    }

    private ResponseEntity<?> cambiarEstado(Long id, boolean completada) {
        try {
            Tarea resultado = tareaService.cambiarEstadoTarea(id, completada);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            HttpStatus status = "La tarea no existe".equals(e.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("mensaje", e.getMessage()));
        }
    }
}
