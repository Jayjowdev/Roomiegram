package com.roomiegram.hogar.dto;

public record ResponderAlternativaVisitaRequest(
        Long interesadoId,
        boolean aceptada,
        String mensaje) {
}
