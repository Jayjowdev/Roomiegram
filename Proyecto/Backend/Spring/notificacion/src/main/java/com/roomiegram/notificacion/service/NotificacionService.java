package com.roomiegram.notificacion.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.roomiegram.notificacion.model.Notificacion;
import com.roomiegram.notificacion.repository.NotificacionRepository;

@Service
public class NotificacionService {

	private final NotificacionRepository notificacionRepository;

	public NotificacionService(NotificacionRepository notificacionRepository) {
		this.notificacionRepository = notificacionRepository;
	}

	public Notificacion guardarNotificacion(Notificacion notificacion) {
		validarNotificacion(notificacion);
		notificacion.setFechaActualizacion(LocalDateTime.now());
		return notificacionRepository.save(notificacion);
	}

	public List<Notificacion> obtenerTodas() {
		return notificacionRepository.findAll();
	}

	public Optional<Notificacion> obtenerPorId(Long id) {
		return notificacionRepository.findById(id);
	}

	public void eliminarNotificacion(Long id) {
		notificacionRepository.deleteById(id);
	}

	private void validarNotificacion(Notificacion notificacion) {
		if (notificacion == null) {
			throw new IllegalArgumentException("La notificacion es obligatoria");
		}

		if (notificacion.getUsuarioEmisorId() == null) {
			throw new IllegalArgumentException("El usuario emisor es obligatorio");
		}

		if (notificacion.getUsuarioReceptorId() == null) {
			throw new IllegalArgumentException("El usuario receptor es obligatorio");
		}

		if (notificacion.getHogarId() == null) {
			throw new IllegalArgumentException("El hogar es obligatorio");
		}

		if (notificacion.getTipo() == null) {
			throw new IllegalArgumentException("El tipo de notificacion es obligatorio");
		}

		if (notificacion.getTitulo() == null || notificacion.getTitulo().isBlank()) {
			throw new IllegalArgumentException("El titulo es obligatorio");
		}

		if (notificacion.getMensaje() == null || notificacion.getMensaje().isBlank()) {
			throw new IllegalArgumentException("El mensaje es obligatorio");
		}
	}

}
