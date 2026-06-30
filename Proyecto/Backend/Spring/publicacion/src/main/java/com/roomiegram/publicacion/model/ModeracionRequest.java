package com.roomiegram.publicacion.model;

public record ModeracionRequest(
        Long moderadorId,
        String motivo
) {
}
