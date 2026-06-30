package com.roomiegram.publicacion.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.publicacion.model.ModeracionRequest;
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

    @Value("${usuario.service.url}")
    private String usuarioServiceUrl;

    // Metodos para guardar y obtener publicaciones
    public Publicacion guardarPublicacion(Publicacion publicacion) {
        String tipo = publicacion.getTipo();
        if (tipo == null || tipo.isBlank()) {
            tipo = "ofrezco_casa";
        }
        publicacion.setTipo(tipo);

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
        boolean esBusquedaRoomie = "busco_roomie".equalsIgnoreCase(tipo);
        if (!esBusquedaRoomie) {
            if (publicacion.getNumeroHabitaciones() <= 0) {
                throw new IllegalArgumentException("El número de habitaciones debe ser mayor que cero");
            }
            if (publicacion.getNumeroPersonas() <= 0) {
                throw new IllegalArgumentException("El número de personas debe ser mayor que cero");
            }
            if (publicacion.getNumeroBanos() <= 0) {
                throw new IllegalArgumentException("El número de baños debe ser mayor que cero");
            }
        } else {
            publicacion.setNumeroHabitaciones(0);
            publicacion.setNumeroPersonas(0);
            publicacion.setNumeroBanos(0);
        }

        return publicacionRepository.save(publicacion);
    }

    //metodo para listar publicaciones visibles
    public List<Publicacion> listarPublicaciones() {
        return publicacionRepository.findAll().stream()
                .filter(publicacion -> !publicacion.estaOcultaPorModeracion())
                .toList();
    }

    public List<Publicacion> listarPublicacionesModeracion() {
        return publicacionRepository.findAll();
    }

    public Publicacion ocultarPublicacion(Long id, ModeracionRequest request) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la publicacion es obligatorio");
        }
        if (request == null || request.moderadorId() == null) {
            throw new IllegalArgumentException("El moderador es obligatorio");
        }
        if (request.motivo() == null || request.motivo().trim().length() < 5) {
            throw new IllegalArgumentException("El motivo de moderacion es obligatorio");
        }

        validarModerador(request.moderadorId());

        Publicacion publicacion = publicacionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La publicacion no existe"));

        publicacion.setEstadoModeracion("OCULTA_MODERACION");
        publicacion.setMotivoModeracion(request.motivo().trim());
        publicacion.setModeradoPorId(request.moderadorId());
        publicacion.setFechaModeracion(LocalDateTime.now());

        return publicacionRepository.save(publicacion);
    }

    public Publicacion actualizarPublicacion(Long id, Publicacion datos, String usuarioSolicitante, String rolSolicitante) {
        if (id == null) {
            throw new IllegalArgumentException("El id de la publicacion es obligatorio");
        }
        if (datos == null) {
            throw new IllegalArgumentException("Los datos de la publicacion son obligatorios");
        }
        if (usuarioSolicitante == null || usuarioSolicitante.isBlank()) {
            throw new IllegalArgumentException("El usuario solicitante no puede estar vacio");
        }
        if (rolSolicitante == null || rolSolicitante.isBlank()) {
            throw new IllegalArgumentException("El rol solicitante no puede estar vacio");
        }

        Publicacion publicacion = publicacionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La publicacion no existe"));

        if (!puedeGestionar(publicacion, usuarioSolicitante, rolSolicitante)) {
            throw new SecurityException("No tienes permisos para editar esta publicacion");
        }

        publicacion.setTitulo(datos.getTitulo());
        publicacion.setUbicacion(datos.getUbicacion());
        publicacion.setDescripcion(datos.getDescripcion());
        publicacion.setPrecio(datos.getPrecio());
        publicacion.setImagen(datos.getImagen());
        publicacion.setGaleria(datos.getGaleria() != null ? new ArrayList<>(datos.getGaleria()) : new ArrayList<>());

        boolean esBusquedaRoomie = "busco_roomie".equalsIgnoreCase(publicacion.getTipo());
        if (esBusquedaRoomie) {
            publicacion.setNumeroHabitaciones(0);
            publicacion.setNumeroPersonas(0);
            publicacion.setNumeroBanos(0);
        } else {
            publicacion.setNumeroHabitaciones(datos.getNumeroHabitaciones());
            publicacion.setNumeroPersonas(datos.getNumeroPersonas());
            publicacion.setNumeroBanos(datos.getNumeroBanos());
        }

        return guardarPublicacion(publicacion);
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

        if (!puedeGestionar(publicacion, usuarioSolicitante, rolSolicitante)) {
            throw new SecurityException("No tienes permisos para eliminar esta publicación");
        }

        publicacionRepository.delete(publicacion);
    }

    private boolean puedeGestionar(Publicacion publicacion, String usuarioSolicitante, String rolSolicitante) {
        boolean esCreador = publicacion.getUsuarioCreador() != null
                && publicacion.getUsuarioCreador().equalsIgnoreCase(usuarioSolicitante.trim());
        boolean esAdmin = "ADMIN".equalsIgnoreCase(rolSolicitante.trim());

        return esCreador || esAdmin;
    }

    @SuppressWarnings("unchecked")
    private void validarModerador(Long moderadorId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    usuarioServiceUrl + "/auth/usuarios/" + moderadorId + "/moderador-valido",
                    Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null || !Boolean.TRUE.equals(body.get("puedeModerar"))) {
                throw new SecurityException("No tienes permisos para moderar publicaciones");
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            throw new SecurityException("No se pudo validar el permiso de moderacion");
        }
    }

    @SuppressWarnings("unchecked")
    public PublicacionConHogarResponse guardarPublicacionConHogar(PublicacionConHogarRequest req) {
        // 1. Create and persist the publication
        Publicacion pub = new Publicacion();
        pub.setUsuarioCreador(req.getUsuarioCreador());
        pub.setTitulo(req.getTitulo());
        pub.setUbicacion(req.getUbicacion());
        pub.setDescripcion(req.getDescripcion());
        pub.setTipo("ofrezco_casa");
        pub.setPrecio(req.getPrecio());
        pub.setNumeroHabitaciones(req.getNumeroHabitaciones());
        pub.setNumeroPersonas(req.getNumeroPersonas());
        pub.setNumeroBanos(req.getNumeroBanos());
        pub.setImagen(req.getImagen());
        pub.setGaleria(req.getGaleria());

        Publicacion creada = guardarPublicacion(pub);

        // 2. Create linked hogar — compensate on failure
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

        // 3. Link publication to hogar — compensate on failure
        try {
            Map<String, Object> recursoPayload = Map.of(
                    "administradorId", req.getUsuarioId(),
                    "recursoId", creada.getId());
            restTemplate.postForEntity(
                    hogarServiceUrl + "/hogares/" + hogarId + "/publicaciones", recursoPayload, Map.class);
        } catch (Exception e) {
            publicacionRepository.delete(creada);
            restTemplate.delete(hogarServiceUrl + "/hogares/" + hogarId);
            throw new RuntimeException("Error al vincular la publicación al hogar: " + e.getMessage());
        }

        return new PublicacionConHogarResponse(creada, hogarId);
    }
}
