export type { CategoriaGasto, CuentaDeudor, EstadoGasto, HogarCuenta } from "./Backend"

export type CreateHogarCuentaPayload = {
  descripcion: string
  monto: number
  deudores?: import("./Backend").CuentaDeudor[]
  categoria?: import("./Backend").CategoriaGasto
  periodo?: string
  fechaVencimiento?: string
  estado?: import("./Backend").EstadoGasto
}
