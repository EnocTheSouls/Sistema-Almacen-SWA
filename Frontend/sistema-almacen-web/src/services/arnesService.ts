import {
  apiClient,
} from "../api/apiClient";

import type {
  Arnes,
} from "../types/arnes";

// Obtiene todos los arneses registrados.
export async function obtenerArneses(): Promise<
  Arnes[]
> {
  const respuesta =
    await apiClient.get<Arnes[]>(
      "/arneses"
    );

  return respuesta.data;
}