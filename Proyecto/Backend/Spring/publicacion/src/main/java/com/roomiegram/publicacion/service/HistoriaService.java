package com.roomiegram.publicacion.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.roomiegram.publicacion.model.Historia;
import com.roomiegram.publicacion.model.HistoriaRequest;
import com.roomiegram.publicacion.repository.HistoriaRepository;

@Service
public class HistoriaService {

    @Autowired
    private HistoriaRepository historiaRepository;

    public List<Historia> listarHistorias() {
        return historiaRepository.findAllByOrderByFechaCreacionDesc();
    }

    public Historia crearHistoria(HistoriaRequest request) {
        validarHistoria(request);

        Historia historia = new Historia();
        historia.setTitulo(request.titulo().trim());
        historia.setMensaje(request.mensaje().trim());
        historia.setNombreVisible(normalizarNombre(request.nombreVisible()));
        historia.setUsuarioCreador(normalizarOpcional(request.usuarioCreador()));

        return historiaRepository.save(historia);
    }

    public Historia actualizarHistoria(Long id, HistoriaRequest request, String usuarioSolicitante, String rolSolicitante) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la historia es obligatorio");
        }
        validarSolicitante(usuarioSolicitante, rolSolicitante);
        validarHistoria(request);

        Historia historia = historiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La historia no existe"));

        if (!puedeGestionar(historia, usuarioSolicitante, rolSolicitante)) {
            throw new SecurityException("No tienes permisos para editar esta historia");
        }

        historia.setTitulo(request.titulo().trim());
        historia.setMensaje(request.mensaje().trim());
        historia.setNombreVisible(normalizarNombre(request.nombreVisible()));

        return historiaRepository.save(historia);
    }

    public void eliminarHistoria(Long id, String usuarioSolicitante, String rolSolicitante) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la historia es obligatorio");
        }
        validarSolicitante(usuarioSolicitante, rolSolicitante);

        Historia historia = historiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La historia no existe"));

        if (!puedeGestionar(historia, usuarioSolicitante, rolSolicitante)) {
            throw new SecurityException("No tienes permisos para eliminar esta historia");
        }

        historiaRepository.delete(historia);
    }

    private void validarHistoria(HistoriaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La historia es obligatoria");
        }
        if (request.titulo() == null || request.titulo().trim().isBlank()) {
            throw new IllegalArgumentException("El titulo es obligatorio");
        }
        if (request.titulo().trim().length() > 80) {
            throw new IllegalArgumentException("El titulo no puede superar 80 caracteres");
        }
        if (request.mensaje() == null || request.mensaje().trim().isBlank()) {
            throw new IllegalArgumentException("El mensaje es obligatorio");
        }
        int largoMensaje = request.mensaje().trim().length();
        if (largoMensaje < 20) {
            throw new IllegalArgumentException("El mensaje debe tener al menos 20 caracteres");
        }
        if (largoMensaje > 500) {
            throw new IllegalArgumentException("El mensaje no puede superar 500 caracteres");
        }
    }

    private String normalizarNombre(String nombreVisible) {
        if (nombreVisible == null || nombreVisible.trim().isBlank()) {
            return "Usuario Roomiegram";
        }
        return nombreVisible.trim().length() > 120
                ? nombreVisible.trim().substring(0, 120)
                : nombreVisible.trim();
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.trim().isBlank()) {
            return null;
        }
        return valor.trim().length() > 120 ? valor.trim().substring(0, 120) : valor.trim();
    }

    private void validarSolicitante(String usuarioSolicitante, String rolSolicitante) {
        if (usuarioSolicitante == null || usuarioSolicitante.trim().isBlank()) {
            throw new IllegalArgumentException("El usuario solicitante no puede estar vacio");
        }
        if (rolSolicitante == null || rolSolicitante.trim().isBlank()) {
            throw new IllegalArgumentException("El rol solicitante no puede estar vacio");
        }
    }

    private boolean puedeGestionar(Historia historia, String usuarioSolicitante, String rolSolicitante) {
        boolean esCreador = historia.getUsuarioCreador() != null
                && historia.getUsuarioCreador().equalsIgnoreCase(usuarioSolicitante.trim());
        boolean esAdmin = "ADMIN".equalsIgnoreCase(rolSolicitante.trim());

        return esCreador || esAdmin;
    }
}
