package com.roomiegram.usuario.DTO;

public record VisitRequestedEmailRequest(
        Long usuarioReceptorId,
        Long usuarioInteresadoId,
        String interesadoNombre,
        String publicacionTitulo,
        String fechaHora,
        String mensaje
) {
}
