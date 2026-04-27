import type { Comprobante } from "../types/Backend";
import { apiUrls, requestJson } from "./api";

export const comprobanteService = {
  crear(comprobante: Comprobante): Promise<Comprobante> {
    return requestJson<Comprobante>(`${apiUrls.comprobantes}/comprobantes`, {
      method: "POST",
      body: JSON.stringify(comprobante),
    });
  },
};
