import type { Tarea } from "../types/Backend";
import { apiUrls, requestJson } from "./api";

export const tareaService = {
  listar(): Promise<Tarea[]> {
    return requestJson<Tarea[]>(`${apiUrls.tareas}/tareas/listar`);
  },

  crear(tarea: Tarea): Promise<Tarea> {
    return requestJson<Tarea>(`${apiUrls.tareas}/tareas/guardar`, {
      method: "POST",
      body: JSON.stringify(tarea),
    });
  },
};
