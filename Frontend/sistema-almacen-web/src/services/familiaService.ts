import { apiClient } from "../api/apiClient";
import type { Familia } from "../types/familia";

export interface CrearFamiliaRequest {
  idProyecto: number;
  nombre: string;
  descripcion: string | null;
}

export interface ActualizarFamiliaRequest {
  idProyecto: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

// Obtiene todas las familias.
export async function obtenerFamilias(): Promise<Familia[]> {
  const respuesta =
    await apiClient.get<Familia[]>(
      "/familias"
    );

  return respuesta.data;
}

// Registra una familia asociada a un proyecto.
export async function crearFamilia(
  datos: CrearFamiliaRequest
): Promise<Familia> {
  const respuesta =
    await apiClient.post<Familia>(
      "/familias",
      datos
    );

  return respuesta.data;
}

// Edita los datos o el estado de una familia.
export async function actualizarFamilia(
  idFamilia: number,
  datos: ActualizarFamiliaRequest
): Promise<Familia> {
  const respuesta =
    await apiClient.put<Familia>(
      `/familias/${idFamilia}`,
      datos
    );

  return respuesta.data;
}

// Elimina una familia sin relaciones.
export async function eliminarFamilia(
  idFamilia: number
): Promise<void> {
  await apiClient.delete(
    `/familias/${idFamilia}`
  );
}