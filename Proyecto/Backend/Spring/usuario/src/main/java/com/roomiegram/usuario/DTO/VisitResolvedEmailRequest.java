package com.roomiegram.usuario.DTO;

public record VisitResolvedEmailRequest(
        Long usuarioInteresadoId,
        Long anfitrionId,
        String publicacionTitulo,
        String fechaHora,
        boolean aceptada
) {
}
