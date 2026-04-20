package com.roomiegram.tarea.controller;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
@CrossOrigin(origins = "*")
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
}
