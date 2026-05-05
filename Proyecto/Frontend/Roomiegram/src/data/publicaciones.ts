import { type Publicacion } from "../types/Publicacion";

export const publicaciones: Publicacion[] = [
    {
        id: 1,
        usuarioCreador: "sofia-roomie",
        titulo: "Busco roomie en Santiago Centro",
        precio: 250000,
        ubicacion: "Santiago Centro",
        descripcion: "Depto compartido cerca del metro",
        numeroHabitaciones: 3,
        numeroPersonas: 2,
        numeroBanos: 1
    },
    {
        id: 2,
        usuarioCreador: "cami-provi",
        titulo: "Habitación disponible en Providencia",
        precio: 220000,
        ubicacion: "Providencia",
        descripcion: "Habitación amoblada con baño privado",
        numeroHabitaciones: 2,
        numeroPersonas: 2,
        numeroBanos: 2
    },
    {
        id: 3,
        usuarioCreador: "dani-nunoa",
        titulo: "Habitación en Ñuñoa",
        precio: 300000,
        ubicacion: "Ñuñoa",
        descripcion: "Busco roomie para compartir depto en zona tranquila",
        numeroHabitaciones: 4,
        numeroPersonas: 3,
        numeroBanos: 2
    }
]