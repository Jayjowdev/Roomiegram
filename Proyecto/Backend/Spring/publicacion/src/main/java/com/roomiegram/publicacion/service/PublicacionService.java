package com.roomiegram.publicacion.service;

import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.repository.PublicacionRepository;

@Service
public class PublicacionService {

    @Autowired
    private PublicacionRepository publicacionRepository;

    // Metodos para guardar y obtener publicaciones
    public Publicacion guardarPublicacion(Publicacion publicacion) {
        if (publicacion.getUsuarioCreador() == null || publicacion.getUsuarioCreador().isBlank()) {
            throw new IllegalArgumentException("El usuario creador no puede estar vacío");
        }
        
        if (publicacion.getTitulo() == null || publicacion.getTitulo().isEmpty()) {
            throw new IllegalArgumentException("El título no puede estar vacío");
        }
        if (publicacion.getUbicacion() == null || publicacion.getUbicacion().isEmpty()) {
            throw new IllegalArgumentException("La ubicación no puede estar vacía");
        }
        if (publicacion.getPrecio() == null || publicacion.getPrecio() <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor que cero");
        }
        if (publicacion.getDescripcion() == null || publicacion.getDescripcion().isEmpty()) {
            throw new IllegalArgumentException("La descripción no puede estar vacía");
        }
        if (publicacion.getNumeroHabitaciones() <= 0) {
            throw new IllegalArgumentException("El número de habitaciones debe ser mayor que cero");
        }
        if (publicacion.getNumeroPersonas() <= 0) {
            throw new IllegalArgumentException("El número de personas debe ser mayor que cero");
        }
        if (publicacion.getNumeroBanos() <= 0) {
            throw new IllegalArgumentException("El número de baños debe ser mayor que cero");
        }

        return publicacionRepository.save(publicacion);
    }

    //metodo para listar todas las publicaciones
    public List<Publicacion> listarPublicaciones() {
        return publicacionRepository.findAll();
    }
    
    // Método para eliminar una publicación con validación de permisos
    public void eliminarPublicacion(Long id, String usuarioSolicitante, String rolSolicitante) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la publicación es obligatorio");
        }
        if (usuarioSolicitante == null || usuarioSolicitante.isBlank()) {
            throw new IllegalArgumentException("El usuario solicitante no puede estar vacío");
        }
        if (rolSolicitante == null || rolSolicitante.isBlank()) {
            throw new IllegalArgumentException("El rol solicitante no puede estar vacío");
        }

        Publicacion publicacion = publicacionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La publicación no existe"));

        if (!puedeEliminar(publicacion, usuarioSolicitante, rolSolicitante)) {
            throw new SecurityException("No tienes permisos para eliminar esta publicación");
        }

        publicacionRepository.delete(publicacion);
    }

    private boolean puedeEliminar(Publicacion publicacion, String usuarioSolicitante, String rolSolicitante) {
        String rolNormalizado = rolSolicitante.trim().toUpperCase(Locale.ROOT);

        if ("ADMIN".equals(rolNormalizado)) {
            return true;
        }

        return publicacion.getUsuarioCreador() != null
                && publicacion.getUsuarioCreador().equalsIgnoreCase(usuarioSolicitante.trim());
    }
}
