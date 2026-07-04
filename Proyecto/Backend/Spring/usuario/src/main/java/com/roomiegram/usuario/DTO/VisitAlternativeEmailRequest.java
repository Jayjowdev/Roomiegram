package com.roomiegram.usuario.DTO;

public record VisitAlternativeEmailRequest(
        Long usuarioInteresadoId,
        Long anfitrionId,
        String publicacionTitulo,
        String fechaHoraAlternativa,
        String mensaje
) {
}
