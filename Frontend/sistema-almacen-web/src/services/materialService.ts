import { apiClient } from "../api/apiClient";

import type {
  MaterialCatalogo,
} from "../types/material";

// Obtiene el catálogo completo de materiales.
export async function obtenerMateriales(): Promise<
  MaterialCatalogo[]
> {
  const respuesta =
    await apiClient.get<MaterialCatalogo[]>(
      "/materiales"
    );

  return respuesta.data;
}

// Obtiene un material por su identificador.
export async function obtenerMaterialPorId(
  idMaterial: number
): Promise<MaterialCatalogo> {
  const respuesta =
    await apiClient.get<MaterialCatalogo>(
      `/materiales/${idMaterial}`
    );

  return respuesta.data;
}

// Busca un material por número de parte.
export async function obtenerMaterialPorNumeroParte(
  numeroParte: string
): Promise<MaterialCatalogo> {
  const numeroParteCodificado =
    encodeURIComponent(
      numeroParte.trim()
    );

  const respuesta =
    await apiClient.get<MaterialCatalogo>(
      `/materiales/numero-parte/${numeroParteCodificado}`
    );

  return respuesta.data;
}