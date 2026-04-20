package com.roomiegram.hogarcuenta.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI hogarCuentaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Cuentas del Hogar - Roomiegram")
                        .description("API REST para gestionar cuentas del hogar")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Equipo Roomiegram")
                                .email("contacto@roomiegram.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}