package com.roomiegram.publicacion.model;

public record HistoriaRequest(
        String titulo,
        String mensaje,
        String nombreVisible,
        String usuarioCreador
) {
}
