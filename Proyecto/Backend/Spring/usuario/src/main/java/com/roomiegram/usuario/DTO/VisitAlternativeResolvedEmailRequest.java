package com.roomiegram.usuario.DTO;

public record VisitAlternativeResolvedEmailRequest(
        Long usuarioAnfitrionId,
        Long interesadoId,
        String publicacionTitulo,
        String fechaHora,
        boolean aceptada
) {
}
