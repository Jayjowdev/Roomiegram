import { crearHogarCuenta, eliminarHogarCuenta, listarHogarCuentas } from "./hogarCuentaService"
import type { HogarCuenta } from "../types/Backend"

export const gastoService = {
  listar: listarHogarCuentas,
  crear: (payload: Pick<HogarCuenta, "descripcion" | "monto" | "deudores" | "categoria" | "periodo" | "fechaVencimiento" | "estado">) => crearHogarCuenta(payload),
  eliminar: eliminarHogarCuenta,
}
