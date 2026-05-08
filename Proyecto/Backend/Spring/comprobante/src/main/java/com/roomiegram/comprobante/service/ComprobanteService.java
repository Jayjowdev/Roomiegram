package com.roomiegram.comprobante.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.roomiegram.comprobante.model.Comprobante;
import com.roomiegram.comprobante.repository.ComprobanteRepository;

@Service
public class ComprobanteService {

	private final ComprobanteRepository comprobanteRepository;

	public ComprobanteService(ComprobanteRepository comprobanteRepository) {
		this.comprobanteRepository = comprobanteRepository;
	}

	public Comprobante crearComprobante(Comprobante comprobante) {
		comprobante.setId(null);
		return comprobanteRepository.save(comprobante);
	}

	public Optional<Comprobante> obtenerPorId(Long id) {
		return comprobanteRepository.findById(id);
	}

	public Comprobante actualizarComprobante(Long id, Comprobante comprobanteActualizado) {
		Comprobante comprobanteExistente = comprobanteRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado"));

		comprobanteExistente.setHogarCuentaId(comprobanteActualizado.getHogarCuentaId());
		comprobanteExistente.setUsuarioId(comprobanteActualizado.getUsuarioId());
		comprobanteExistente.setNombreArchivo(comprobanteActualizado.getNombreArchivo());
		comprobanteExistente.setTipoContenido(comprobanteActualizado.getTipoContenido());
		comprobanteExistente.setTamanoArchivo(comprobanteActualizado.getTamanoArchivo());
		comprobanteExistente.setMontoPagado(comprobanteActualizado.getMontoPagado());
		comprobanteExistente.setObservacion(comprobanteActualizado.getObservacion());
		if (comprobanteActualizado.getFechaSubida() != null) {
			comprobanteExistente.setFechaSubida(comprobanteActualizado.getFechaSubida());
		}
		comprobanteExistente.setArchivo(comprobanteActualizado.getArchivo());

		return comprobanteRepository.save(comprobanteExistente);
	}

	public void eliminarComprobante(Long id) {
		comprobanteRepository.deleteById(id);
	}
}
