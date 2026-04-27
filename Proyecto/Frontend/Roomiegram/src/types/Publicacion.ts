export type TipoPublicacion = "busco_roomie" | "ofrezco_casa";

export type Publicacion = {
  id: number;
  tipo: TipoPublicacion;
  nombre: string;
  edad?: number;
  titulo?: string;
  precio?: number;
  ubicacion: string;
  descripcion: string;
  intereses?: string[];
  habitos?: string[];
  presupuestoMaximo?: number;
  imagen?: string;
  galeria?: string[];
  precioMensual?: number;
  amenidades?: string[];
}
export type User = {
  id: number;
  email: string;
  nombre: string;
  edad?: number;
  ubicacion?: string;
  descripcion?: string;
  imagen?: string;
  tipo?: TipoPublicacion;
  intereses?: string[];
  amenidades?: string[];
  createdAt?: string;
  updatedAt?: string;
};
