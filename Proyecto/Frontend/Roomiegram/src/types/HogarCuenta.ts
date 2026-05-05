export type CuentaDeudor = {
  id: number
  usuarioId: number
  montoAdeudado: number
}

export type HogarCuenta = {
  id: number
  descripcion: string
  monto: number
  deudores: CuentaDeudor[]
}

export type CreateHogarCuentaPayload = {
  descripcion: string
  monto: number
}
