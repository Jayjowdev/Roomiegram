package com.roomiegram.usuario.DTO;

public record RequestResolvedEmailRequest(
        Long usuarioSolicitanteId,
        Long administradorId,
        String hogarNombre,
        boolean aceptada
) {
}
