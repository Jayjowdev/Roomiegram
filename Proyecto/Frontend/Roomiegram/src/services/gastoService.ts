import type { HogarCuenta } from "../types/Backend";
import { apiUrls, requestJson } from "./api";

export const gastoService = {
  listar(): Promise<HogarCuenta[]> {
    return requestJson<HogarCuenta[]>(`${apiUrls.hogarCuentas}/hogar-cuentas`);
  },

  crear(cuenta: HogarCuenta): Promise<HogarCuenta> {
    return requestJson<HogarCuenta>(`${apiUrls.hogarCuentas}/hogar-cuentas`, {
      method: "POST",
      body: JSON.stringify(cuenta),
    });
  },
};
