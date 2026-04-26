package com.roomiegram.hogar.dto;

public record CreateHogarRequest(
        String nombre,
        String descripcion,
        Long usuarioCreadorId
) {
}