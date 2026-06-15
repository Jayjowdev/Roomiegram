package com.roomiegram.tarea.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.roomiegram.tarea.model.Tarea;
import com.roomiegram.tarea.repository.TareaRepository;

@Service
public class TareaService {

    @Autowired
    private TareaRepository tareaRepository;

    public Tarea guardarTarea(Tarea tarea) {
        validarTarea(tarea);
        return tareaRepository.save(tarea);
    }

    public Tarea actualizarTarea(Long id, Tarea datos) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la tarea es obligatorio");
        }

        Tarea existente = tareaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La tarea no existe"));

        validarTarea(datos);
        existente.setTitulo(datos.getTitulo());
        existente.setEncargado(datos.getEncargado());
        existente.setDescripcion(datos.getDescripcion());
        existente.setFecha(datos.getFecha());

        return tareaRepository.save(existente);
    }

    public List<Tarea> listarTareas() {
        return tareaRepository.findAll();
    }

    private void validarTarea(Tarea tarea) {
        if (tarea == null) {
            throw new IllegalArgumentException("Los datos de la tarea son obligatorios");
        }
        if (tarea.getTitulo() == null || tarea.getTitulo().isBlank()) {
            throw new IllegalArgumentException("El título de la tarea no puede estar vacío");
        }
        if (tarea.getEncargado() == null || tarea.getEncargado().isBlank()) {
            throw new IllegalArgumentException("El encargado de la tarea no puede estar vacío");
        }
        if (tarea.getDescripcion() == null || tarea.getDescripcion().isBlank()) {
            throw new IllegalArgumentException("La descripción de la tarea no puede estar vacía");
        }
        if (tarea.getFecha() == null) {
            throw new IllegalArgumentException("La fecha de la tarea no puede estar vacía");
        }
    }
}
