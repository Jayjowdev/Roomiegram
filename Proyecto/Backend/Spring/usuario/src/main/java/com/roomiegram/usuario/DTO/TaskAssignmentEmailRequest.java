package com.roomiegram.usuario.DTO;

public record TaskAssignmentEmailRequest(
        Long usuarioId,
        String titulo,
        String descripcion,
        String fecha,
        String hogarNombre,
        String asignadorNombre
) {
}
