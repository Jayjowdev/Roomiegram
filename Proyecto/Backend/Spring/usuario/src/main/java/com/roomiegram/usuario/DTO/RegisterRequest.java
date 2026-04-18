package com.roomiegram.usuario.DTO;

public record RegisterRequest(
    String nombre,
    String correo,
    String telefono,
    String contrasena,
    String usuario
) {}
