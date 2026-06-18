package com.roomiegram.usuario.DTO;

public record RequestReceivedEmailRequest(
        Long usuarioReceptorId,
        Long usuarioSolicitanteId,
        String solicitanteNombre,
        String hogarNombre,
        String publicacionTitulo
) {
}
