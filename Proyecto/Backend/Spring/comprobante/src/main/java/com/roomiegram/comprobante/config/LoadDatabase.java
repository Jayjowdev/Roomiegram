package com.roomiegram.comprobante.config;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.comprobante.model.Comprobante;
import com.roomiegram.comprobante.repository.ComprobanteRepository;

@Configuration
public class LoadDatabase {

	@Bean
	CommandLineRunner initDatabase(ComprobanteRepository comprobanteRepository) {
		return args -> {
			if (comprobanteRepository.count() == 0) {
				Comprobante comprobante = new Comprobante();
				comprobante.setHogarCuentaId(1L);
				comprobante.setUsuarioId(1L);
				comprobante.setNombreArchivo("comprobante-arriendo.pdf");
				comprobante.setTituloGasto("Arriendo mensual");
				comprobante.setTipoContenido("application/pdf");
				comprobante.setTamanoArchivo(2048L);
				comprobante.setMontoPagado(new BigDecimal("350000.00"));
				comprobante.setObservacion("Pago de arriendo correspondiente al mes actual.");
				comprobante.setFechaSubida(LocalDateTime.now().minusDays(1));
				comprobante.setArchivo("archivo de ejemplo".getBytes(StandardCharsets.UTF_8));
				comprobanteRepository.save(comprobante);

				System.out.println("Base de datos inicializada con comprobantes de ejemplo.");
			} else {
				System.out.println("La Base de datos ya contiene datos.");
			}
		};
	}
}
