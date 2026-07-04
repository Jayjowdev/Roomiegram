package com.roomiegram.hogar.dto;

import java.time.LocalDateTime;

public record CrearVisitaRequest(
    Long hogarId,
    Long usuarioVisitanteId,
    LocalDateTime fechaVisita,
    String comentarios
) {}
