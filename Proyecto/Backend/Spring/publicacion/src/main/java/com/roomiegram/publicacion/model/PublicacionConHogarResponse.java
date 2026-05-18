package com.roomiegram.publicacion.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicacionConHogarResponse {

    private Publicacion publicacion;
    private Long hogarId;
}
