package com.roomiegram.hogar.dto;

import java.time.LocalDateTime;

public record CrearVisitaRequest(
        Long publicacionId,
        Long hogarId,
        Long interesadoId,
        Long anfitrionId,
        LocalDateTime fechaHoraPropuesta,
        String mensaje) {
}
