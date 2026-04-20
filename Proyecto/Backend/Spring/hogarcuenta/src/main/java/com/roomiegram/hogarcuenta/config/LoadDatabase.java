package com.roomiegram.hogarcuenta.config;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.hogarcuenta.model.HogarCuenta;
import com.roomiegram.hogarcuenta.repository.HogarCuentaRepository;
import com.roomiegram.hogarcuenta.service.HogarCuentaService;

@Configuration
public class LoadDatabase {

    @Bean
    CommandLineRunner initDatabase(HogarCuentaRepository hogarCuentaRepository, HogarCuentaService hogarCuentaService) {
        return args -> {
            if (hogarCuentaRepository.count() == 0) {
                HogarCuenta hogarCuenta = new HogarCuenta();
                hogarCuenta.setDescripcion("Cuenta de internet del departamento");
                hogarCuenta.setMonto(new BigDecimal("36000.00"));
                hogarCuenta.agregarDeudor(1L);
                hogarCuenta.agregarDeudor(2L);
                hogarCuenta.agregarDeudor(3L);
                hogarCuentaService.guardarHogarCuenta(hogarCuenta);

                System.out.println("Base de datos vacia. Se cargaron datos iniciales de hogarcuenta.");
            } else {
                System.out.println("La base de datos de hogarcuenta ya contiene datos.");
            }
        };
    }
}