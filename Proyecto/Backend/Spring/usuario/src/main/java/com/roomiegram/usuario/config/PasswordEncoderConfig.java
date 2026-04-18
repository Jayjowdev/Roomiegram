package com.roomiegram.usuario.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.usuario.service.BcryptPasswordEncoder;

@Configuration
public class PasswordEncoderConfig {
    @Bean
    public BcryptPasswordEncoder passwordEncoder() {
        return new BcryptPasswordEncoder();
    }
}
