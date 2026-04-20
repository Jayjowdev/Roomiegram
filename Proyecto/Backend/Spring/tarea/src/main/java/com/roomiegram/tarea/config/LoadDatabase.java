package com.roomiegram.tarea.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.tarea.model.Tarea;
import com.roomiegram.tarea.repository.TareaRepository;

@Configuration
public class LoadDatabase {
        @Bean
        CommandLineRunner initDatabase(TareaRepository tareaRepository) {
        return args -> {
            // Database initialization logic can be added here
            if(tareaRepository.count() == 0) {
                Tarea tarea = new Tarea();
                tarea.setTitulo("Encargado de ordenar el living");
                tarea.setEncargado("Juan Pérez");
                tarea.setDescripcion("Barrer, trapear y organizar el living");
                tarea.setFecha(java.time.LocalDate.now().plusDays(3));
                tareaRepository.save(tarea);

        
                System.out.println("Base de datos esta vacia. Puedes agregar datos iniciales aquí.");
            } else {
                System.out.println("La Base de datos ya contiene datos.");
            }
        };
    }
}