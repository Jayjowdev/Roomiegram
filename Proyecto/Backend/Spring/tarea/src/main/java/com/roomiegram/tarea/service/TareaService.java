package com.roomiegram.tarea.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.tarea.model.Tarea;
import com.roomiegram.tarea.repository.TareaRepository;

@Service
public class TareaService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${usuario.service.url}")
    private String usuarioServiceUrl;

    private static final int LIMITE_GRATIS_MES = 5;

    public Tarea guardarTarea(Tarea tarea) {
        validarTarea(tarea);
        normalizarEstado(tarea);

        if (tarea.getFechaCreacion() == null) {
            tarea.setFechaCreacion(LocalDate.now());
        }

        if (tarea.getCreadoPorId() != null) {
            validarLimiteTareas(tarea.getCreadoPorId());
        }

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
        normalizarEstado(existente);

        return tareaRepository.save(existente);
    }

    public Tarea cambiarEstadoTarea(Long id, boolean completada) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la tarea es obligatorio");
        }

        Tarea existente = tareaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La tarea no existe"));

        existente.setCompletada(completada);
        return tareaRepository.save(existente);
    }

    public List<Tarea> listarTareas() {
        return tareaRepository.findAll().stream()
                .peek(this::normalizarEstado)
                .toList();
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

    private void normalizarEstado(Tarea tarea) {
        if (tarea.getCompletada() == null) {
            tarea.setCompletada(false);
        }
    }

    @SuppressWarnings("unchecked")
    private void validarLimiteTareas(Long usuarioId) {
        String url = usuarioServiceUrl + "/auth/membresias/usuario/" + usuarioId;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("No se pudo verificar la suscripcion del usuario");
            }

            String plan = response.getBody().get("plan") != null
                    ? response.getBody().get("plan").toString()
                    : "GRATIS";

            if ("GRATIS".equalsIgnoreCase(plan)) {
                LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
                long tareasEsteMes = tareaRepository.countByCreadoPorIdAndFechaCreacionGreaterThanEqual(
                        usuarioId, inicioMes);
                if (tareasEsteMes >= LIMITE_GRATIS_MES) {
                    throw new IllegalArgumentException(
                            "Has alcanzado el limite de " + LIMITE_GRATIS_MES + " tareas por mes para el plan gratuito. " +
                            "Actualiza tu suscripcion para crear tareas ilimitadas.");
                }
            }
        } catch (RestClientException e) {
            throw new IllegalArgumentException("No se pudo verificar la suscripcion: " + e.getMessage());
        }
    }
}
