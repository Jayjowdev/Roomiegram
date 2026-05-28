package com.roomiegram.publicacion.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.model.PublicacionConHogarRequest;
import com.roomiegram.publicacion.model.PublicacionConHogarResponse;
import com.roomiegram.publicacion.repository.PublicacionRepository;

@Service
public class PublicacionService {

    @Autowired
    private PublicacionRepository publicacionRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${hogar.service.url}")
    private String hogarServiceUrl;

    public Publicacion guardarPublicacion(Publicacion publicacion) {
        normalizarPublicacion(publicacion);

        if (publicacion.getUsuarioCreador() == null || publicacion.getUsuarioCreador().isBlank()) {
            throw new IllegalArgumentException("El usuario creador no puede estar vacio");
        }
        if (publicacion.getTitulo() == null || publicacion.getTitulo().isEmpty()) {
            throw new IllegalArgumentException("El titulo no puede estar vacio");
        }
        if (publicacion.getUbicacion() == null || publicacion.getUbicacion().isEmpty()) {
            throw new IllegalArgumentException("La ubicacion no puede estar vacia");
        }
        if (publicacion.getPrecio() == null || publicacion.getPrecio() <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor que cero");
        }
        if (publicacion.getDescripcion() == null || publicacion.getDescripcion().isEmpty()) {
            throw new IllegalArgumentException("La descripcion no puede estar vacia");
        }

        if (esPublicacionDeHogar(publicacion)) {
            if (publicacion.getNumeroHabitaciones() <= 0) {
                throw new IllegalArgumentException("El numero de habitaciones debe ser mayor que cero");
            }
            if (publicacion.getNumeroPersonas() <= 0) {
                throw new IllegalArgumentException("El numero de personas debe ser mayor que cero");
            }
            if (publicacion.getNumeroBanos() <= 0) {
                throw new IllegalArgumentException("El numero de banos debe ser mayor que cero");
            }
        }

        return publicacionRepository.save(publicacion);
    }

    public List<Publicacion> listarPublicaciones() {
        return publicacionRepository.findAll();
    }

    public void eliminarPublicacion(Long id, String usuarioSolicitante, String rolSolicitante) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la publicacion es obligatorio");
        }
        if (usuarioSolicitante == null || usuarioSolicitante.isBlank()) {
            throw new IllegalArgumentException("El usuario solicitante no puede estar vacio");
        }
        if (rolSolicitante == null || rolSolicitante.isBlank()) {
            throw new IllegalArgumentException("El rol solicitante no puede estar vacio");
        }

        Publicacion publicacion = publicacionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La publicacion no existe"));

        if (!puedeEliminar(publicacion, usuarioSolicitante)) {
            throw new SecurityException("No tienes permisos para eliminar esta publicacion");
        }

        publicacionRepository.delete(publicacion);
    }

    private boolean puedeEliminar(Publicacion publicacion, String usuarioSolicitante) {
        return publicacion.getUsuarioCreador() != null
                && publicacion.getUsuarioCreador().equalsIgnoreCase(usuarioSolicitante.trim());
    }

    private void normalizarPublicacion(Publicacion publicacion) {
        if (publicacion == null) {
            throw new IllegalArgumentException("La publicacion es obligatoria");
        }

        String tipo = publicacion.getTipo();
        publicacion.setTipo(tipo == null || tipo.isBlank() ? "ofrezco_casa" : tipo.trim());

        if (!esPublicacionDeHogar(publicacion)) {
            publicacion.setNumeroHabitaciones(1);
            publicacion.setNumeroPersonas(1);
            publicacion.setNumeroBanos(1);
            if (publicacion.getPresupuestoMaximo() == null) {
                publicacion.setPresupuestoMaximo(publicacion.getPrecio());
            }
        }
    }

    private boolean esPublicacionDeHogar(Publicacion publicacion) {
        return !"busco_roomie".equalsIgnoreCase(publicacion.getTipo());
    }

    @SuppressWarnings("unchecked")
    public PublicacionConHogarResponse guardarPublicacionConHogar(PublicacionConHogarRequest req) {
        Publicacion pub = new Publicacion();
        pub.setTipo("ofrezco_casa");
        pub.setUsuarioCreador(req.getUsuarioCreador());
        pub.setTitulo(req.getTitulo());
        pub.setUbicacion(req.getUbicacion());
        pub.setDescripcion(req.getDescripcion());
        pub.setPrecio(req.getPrecio());
        pub.setNumeroHabitaciones(req.getNumeroHabitaciones());
        pub.setNumeroPersonas(req.getNumeroPersonas());
        pub.setNumeroBanos(req.getNumeroBanos());
        pub.setImagen(req.getImagen());
        pub.setGaleria(req.getGaleria());

        Publicacion creada = guardarPublicacion(pub);

        Long hogarId;
        try {
            Map<String, Object> hogarPayload = Map.of(
                    "nombre", req.getTitulo(),
                    "descripcion", req.getDescripcion(),
                    "usuarioCreadorId", req.getUsuarioId());
            ResponseEntity<Map> hogarResp = restTemplate.postForEntity(
                    hogarServiceUrl + "/hogares", hogarPayload, Map.class);
            hogarId = ((Number) hogarResp.getBody().get("id")).longValue();
        } catch (Exception e) {
            publicacionRepository.delete(creada);
            throw new RuntimeException("Error al crear el hogar vinculado: " + e.getMessage());
        }

        try {
            Map<String, Object> recursoPayload = Map.of(
                    "administradorId", req.getUsuarioId(),
                    "recursoId", creada.getId());
            restTemplate.postForEntity(
                    hogarServiceUrl + "/hogares/" + hogarId + "/publicaciones", recursoPayload, Map.class);
        } catch (Exception e) {
            publicacionRepository.delete(creada);
            restTemplate.delete(hogarServiceUrl + "/hogares/" + hogarId);
            throw new RuntimeException("Error al vincular la publicacion al hogar: " + e.getMessage());
        }

        return new PublicacionConHogarResponse(creada, hogarId);
    }
}
