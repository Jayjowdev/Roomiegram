package com.roomiegram.usuario.DTO;

public record CreateAdminRequest(
    String nombre,
    String usuario,
    String correo,
    String telefono,
    String contrasena
) {}
