package com.roomiegram.usuario.DTO;

public record TaskCompletedEmailRequest(
        Long usuarioReceptorId,
        Long usuarioCompletadorId,
        String titulo,
        String descripcion,
        String fecha,
        String hogarNombre
) {
}
