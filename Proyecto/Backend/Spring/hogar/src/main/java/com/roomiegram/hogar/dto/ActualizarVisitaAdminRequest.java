package com.roomiegram.hogar.dto;

public record ActualizarVisitaAdminRequest(
    String estado,
    String comentarios,
    Long administradorId
) {}
