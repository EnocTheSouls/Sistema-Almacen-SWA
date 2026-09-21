import {
  apiClient,
} from "../api/apiClient";

import type {
  ActualizarMaterialRequest,
  CrearMaterialRequest,
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

// Registra manualmente un material nuevo.
// El Backend permite esta operación solo a Administradores.
export async function crearMaterial(
  datos: CrearMaterialRequest
): Promise<MaterialCatalogo> {
  const respuesta =
    await apiClient.post<MaterialCatalogo>(
      "/materiales",
      datos
    );

  return respuesta.data;
}

// Actualiza un material.
// Solo ADMIN puede usar este endpoint.
export async function actualizarMaterial(
  idMaterial: number,
  datos: ActualizarMaterialRequest
): Promise<MaterialCatalogo> {
  const respuesta =
    await apiClient.put<MaterialCatalogo>(
      `/materiales/${idMaterial}`,
      datos
    );

  return respuesta.data;
}

// Elimina un material sin relaciones.
export async function eliminarMaterial(
  idMaterial: number
): Promise<void> {
  await apiClient.delete(
    `/materiales/${idMaterial}`
  );
}

// Activa o inactiva un material.
export async function cambiarEstadoMaterial(
  idMaterial: number,
  activo: boolean
): Promise<void> {
  await apiClient.patch(
    `/materiales/${idMaterial}/estado`,
    null,
    {
      params: {
        activo,
      },
    }
  );
}