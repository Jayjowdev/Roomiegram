package com.roomiegram.publicacion.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.publicacion.model.Publicacion;
import com.roomiegram.publicacion.repository.PublicacionRepository;


@Configuration
public class LoadDatabase {
    @Bean
    CommandLineRunner initDatabase(PublicacionRepository publicacionRepository) {
        return args -> {
            // Database initialization logic can be added here
            if(publicacionRepository.count() == 0) {
                Publicacion publicacion = new Publicacion();
                publicacion.setTitulo("Se busca roomie para departamento amoblado");
                publicacion.setUbicacion("Santiago Centro");
                publicacion.setDescripcion( "Departamento amoblado cerca del metro, ideal para estudiantes o profesionales jóvenes.");
                publicacion.setPrecio(350000.0);
                publicacion.setNumeroHabitaciones(2);
                publicacion.setNumeroPersonas(1);
                publicacion.setNumeroBanos(1);
                publicacionRepository.save(publicacion);

        
                System.out.println("Base de datos esta vacia. Puedes agregar datos iniciales aquí.");
            } else {
                System.out.println("La Base de datos ya contiene datos.");
            }
        };
    }
}