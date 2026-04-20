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

    // Métodos para manejar la lógica de negocio relacionada con las tareas
    public Tarea guardarTarea(Tarea tarea) {

        if (tarea.getTitulo() == null || tarea.getTitulo().isEmpty()) {
            throw new IllegalArgumentException("El título de la tarea no puede estar vacío");
        }
        if (tarea.getEncargado() == null || tarea.getEncargado().isEmpty()) {
            throw new IllegalArgumentException("El encargado de la tarea no puede estar vacío");
        }
        if (tarea.getDescripcion() == null || tarea.getDescripcion().isEmpty()) {
            throw new IllegalArgumentException("La descripción de la tarea no puede estar vacía");
        }
        if (tarea.getFecha() == null) {
            throw new IllegalArgumentException("La fecha de la tarea no puede estar vacía");
        }
        return tareaRepository.save(tarea);
    }

    // Método para listar todas las tareas
    public List<Tarea> listarTareas(){
        return tareaRepository.findAll();
    }


    
}
