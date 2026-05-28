package com.roomiegram.usuario.config;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        return request -> {
            String origin = request.getHeader("Origin");
            CorsConfiguration configuration = new CorsConfiguration();

            if (isAllowedOrigin(origin)) {
                configuration.setAllowedOrigins(List.of(origin));
            }

            configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            configuration.setAllowedHeaders(Arrays.asList("*"));
            configuration.setAllowCredentials(true);
            return configuration;
        };
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return false;
        }

        try {
            URI uri = URI.create(origin);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            int port = uri.getPort();

            return ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                && host != null
                && port == 5173;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
