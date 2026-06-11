package com.roomiegram.comprobante.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.roomiegram.comprobante.model.Comprobante;
import com.roomiegram.comprobante.service.ComprobanteService;

@RestController
@RequestMapping("/comprobantes")
public class ComprobanteController {

	private final ComprobanteService comprobanteService;

	public ComprobanteController(ComprobanteService comprobanteService) {
		this.comprobanteService = comprobanteService;
	}

	@PostMapping
	public ResponseEntity<Comprobante> crear(@RequestBody Comprobante comprobante) {
		Comprobante comprobanteGuardado = comprobanteService.crearComprobante(comprobante);
		return ResponseEntity.status(HttpStatus.CREATED).body(comprobanteGuardado);
	}

	@GetMapping
	public List<Comprobante> listar() {
		return comprobanteService.listarComprobantes();
	}

	@PutMapping("/{id}")
	public Comprobante actualizar(@PathVariable Long id, @RequestBody Comprobante comprobante) {
		if (comprobanteService.obtenerPorId(id).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprobante no encontrado");
		}

		return comprobanteService.actualizarComprobante(id, comprobante);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> eliminar(@PathVariable Long id) {
		if (comprobanteService.obtenerPorId(id).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprobante no encontrado");
		}

		comprobanteService.eliminarComprobante(id);
		return ResponseEntity.noContent().build();
	}
}
