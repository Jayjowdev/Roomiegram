package com.roomiegram.hogar.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.repository.HogarRepository;

@Configuration
public class LoadDatabase {

	@Bean
	CommandLineRunner initDatabase(HogarRepository hogarRepository) {
		return args -> {
			if (hogarRepository.count() == 0) {
				Hogar hogar = new Hogar();
				hogar.setNombre("Hogar Central Roomiegram");
				hogar.setDescripcion("Hogar inicial de ejemplo para pruebas del microservicio");
				hogar.setUsuarioCreadorId(1L);
				hogar.setUsuarioAdministradorId(1L);
				hogar.setActivo(true);

				hogarRepository.save(hogar);
				System.out.println("Base de datos inicializada con un hogar de ejemplo.");
			} else {
				System.out.println("La base de datos de hogar ya contiene registros.");
			}
		};
	}
}
