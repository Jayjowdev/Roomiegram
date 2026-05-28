export type BackendPublicacion = {
  id: number;
  usuarioCreador?: string;
  titulo: string;
  ubicacion: string;
  descripcion: string;
  precio: number;
  numeroHabitaciones?: number;
  numeroPersonas?: number;
  numeroBanos?: number;
  imagen?: string;
  galeria?: string[];
};

export type PublicacionRequest = {
  usuarioCreador: string;
  titulo: string;
  ubicacion: string;
  descripcion: string;
  precio: number;
  numeroHabitaciones: number;
  numeroPersonas: number;
  numeroBanos: number;
  imagen?: string;
  galeria?: string[];
};

export type Tarea = {
  id?: number;
  titulo: string;
  encargado: string;
  descripcion: string;
  fecha: string;
};

export type CuentaDeudor = {
  id?: number;
  usuarioId: number;
  montoAdeudado?: number;
};

export type HogarCuenta = {
  id?: number;
  descripcion: string;
  monto: number;
  deudores?: CuentaDeudor[];
  montoPorPersona?: number;
};

export type Comprobante = {
  id?: number;
  hogarCuentaId: number;
  usuarioId: number;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoArchivo: number;
  montoPagado: number;
  observacion?: string;
  fechaSubida?: string;
  archivo: string;
};

export type Notificacion = {
  id?: number;
  usuarioEmisorId: number;
  usuarioReceptorId: number;
  hogarId: number;
  referenciaId?: number;
  tipo: string;
  estado: string;
  titulo: string;
  mensaje: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
};

export type Hogar = {
  id?: number;
  nombre: string;
  descripcion?: string;
  usuarioCreadorId: number;
  usuarioAdministradorId?: number;
  activo?: boolean;
  fechaCreacion?: string;
  integrantesIds?: number[];
  solicitudesPendientesIds?: number[];
  tareasIds?: number[];
  hogarCuentaIds?: number[];
  comprobanteIds?: number[];
  publicacionIds?: number[];
};

export type CreateHogarRequest = {
  nombre: string;
  descripcion?: string;
  usuarioCreadorId: number;
};

export type UsuarioRequest = {
  usuarioId: number;
};

export type AdminActionRequest = {
  administradorId: number;
};

export type RecursoHogarRequest = {
  administradorId: number;
  recursoId: number;
};
