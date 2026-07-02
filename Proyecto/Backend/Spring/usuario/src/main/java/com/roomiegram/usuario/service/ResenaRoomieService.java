package com.roomiegram.usuario.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.roomiegram.usuario.model.ResenaRoomie;
import com.roomiegram.usuario.repository.RegisterRepository;
import com.roomiegram.usuario.repository.ResenaRoomieRepository;

@Service
public class ResenaRoomieService {

    private final ResenaRoomieRepository resenaRoomieRepository;
    private final RegisterRepository registerRepository;

    public ResenaRoomieService(ResenaRoomieRepository resenaRoomieRepository, RegisterRepository registerRepository) {
        this.resenaRoomieRepository = resenaRoomieRepository;
        this.registerRepository = registerRepository;
    }

    public List<ResenaRoomie> obtenerPorUsuario(Long usuarioId) {
        validarUsuario(usuarioId, "El usuario evaluado no existe");
        return resenaRoomieRepository.findByUsuarioEvaluadoIdOrderByFechaCreacionDesc(usuarioId);
    }

    public ResenaRoomie crear(ResenaRoomie resena) {
        validarResena(resena);
        resena.setId(null);
        resena.setComentario(resena.getComentario().trim());
        return resenaRoomieRepository.save(resena);
    }

    private void validarResena(ResenaRoomie resena) {
        if (resena == null) {
            throw new IllegalArgumentException("La reseña es obligatoria");
        }

        validarUsuario(resena.getUsuarioEvaluadoId(), "El usuario evaluado no existe");
        validarUsuario(resena.getUsuarioAutorId(), "El usuario autor no existe");

        if (resena.getUsuarioEvaluadoId().equals(resena.getUsuarioAutorId())) {
            throw new IllegalArgumentException("No puedes reseñarte a ti mismo");
        }

        if (resena.getHogarId() == null || resena.getHogarId() <= 0) {
            throw new IllegalArgumentException("El hogar asociado es obligatorio");
        }

        if (resena.getPuntuacion() == null || resena.getPuntuacion() < 1 || resena.getPuntuacion() > 5) {
            throw new IllegalArgumentException("La puntuación debe estar entre 1 y 5");
        }

        if (resena.getComentario() == null || resena.getComentario().isBlank()) {
            throw new IllegalArgumentException("El comentario es obligatorio");
        }

        if (resena.getComentario().trim().length() > 500) {
            throw new IllegalArgumentException("El comentario no puede superar 500 caracteres");
        }
    }

    private void validarUsuario(Long usuarioId, String mensaje) {
        if (usuarioId == null || !registerRepository.existsById(usuarioId)) {
            throw new IllegalArgumentException(mensaje);
        }
    }
}
