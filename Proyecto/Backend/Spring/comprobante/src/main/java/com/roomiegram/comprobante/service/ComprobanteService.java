package com.roomiegram.comprobante.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.comprobante.model.Comprobante;
import com.roomiegram.comprobante.repository.ComprobanteRepository;

@Service
public class ComprobanteService {

	private final ComprobanteRepository comprobanteRepository;
	private final RestTemplate restTemplate;

	@Value("${usuario.service.url}")
	private String usuarioServiceUrl;

	public ComprobanteService(ComprobanteRepository comprobanteRepository, RestTemplate restTemplate) {
		this.comprobanteRepository = comprobanteRepository;
		this.restTemplate = restTemplate;
	}

	public Comprobante crearComprobante(Comprobante comprobante) {
		comprobante.setId(null);
		if (comprobante.getTituloGasto() == null || comprobante.getTituloGasto().isBlank()) {
			throw new IllegalArgumentException("El titulo del gasto es obligatorio para identificar el comprobante");
		}
		if (comprobante.getUsuarioId() != null) {
			validarPlanHogar(comprobante.getUsuarioId());
		}
		comprobante.setTituloGasto(comprobante.getTituloGasto().trim());
		return comprobanteRepository.save(comprobante);
	}

	public Optional<Comprobante> obtenerPorId(Long id) {
		return comprobanteRepository.findById(id);
	}

	public List<Comprobante> listarComprobantes() {
		return comprobanteRepository.findAll();
	}

	public Comprobante actualizarComprobante(Long id, Comprobante comprobanteActualizado) {
		Comprobante comprobanteExistente = comprobanteRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado"));

		comprobanteExistente.setHogarCuentaId(comprobanteActualizado.getHogarCuentaId());
		comprobanteExistente.setUsuarioId(comprobanteActualizado.getUsuarioId());
		comprobanteExistente.setNombreArchivo(comprobanteActualizado.getNombreArchivo());
		comprobanteExistente.setTituloGasto(comprobanteActualizado.getTituloGasto());
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

	@SuppressWarnings("unchecked")
	private void validarPlanHogar(Long usuarioId) {
		String url = usuarioServiceUrl + "/auth/membresias/usuario/" + usuarioId;
		try {
			ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
			if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
				throw new IllegalArgumentException("No se pudo verificar la suscripcion del usuario");
			}
			Object plan = response.getBody().get("plan");
			if (plan == null || !"PREMIUM_HOGAR".equalsIgnoreCase(plan.toString())) {
				throw new IllegalArgumentException(
						"Solo los usuarios con plan Premium Hogar pueden subir comprobantes. Actualiza tu suscripcion.");
			}
		} catch (RestClientException e) {
			throw new IllegalArgumentException("No se pudo verificar la suscripcion: " + e.getMessage());
		}
	}
}
