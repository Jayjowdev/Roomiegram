package com.roomiegram.usuario.DTO;

public record SupportContactRequest(
        String asunto,
        String mensaje,
        String correo,
        String nombre,
        String usuario
) {
}
