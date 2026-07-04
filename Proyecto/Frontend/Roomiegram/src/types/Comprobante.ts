export type Comprobante = {
  id: number
  hogarCuentaId: number
  usuarioId: number
  nombreArchivo: string
  tituloGasto: string
  tipoContenido: string
  tamanoArchivo: number
  montoPagado: number
  observacion: string
  fechaSubida: string
}

export type CreateComprobantePayload = {
  hogarCuentaId: number
  usuarioId: number
  nombreArchivo: string
  tituloGasto: string
  tipoContenido: string
  tamanoArchivo: number
  montoPagado: number
  observacion: string
  archivo: string
}
