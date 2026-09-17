import { apiClient } from "../api/apiClient";
import type { Proyecto } from "../types/proyecto";

export interface CrearProyectoRequest {
  nombre: string;
  descripcion: string | null;
}

export interface ActualizarProyectoRequest {
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

// Obtiene todos los proyectos.
export async function obtenerProyectos(): Promise<Proyecto[]> {
  const respuesta =
    await apiClient.get<Proyecto[]>(
      "/proyectos"
    );

  return respuesta.data;
}

// Crea un proyecto.
export async function crearProyecto(
  datos: CrearProyectoRequest
): Promise<Proyecto> {
  const respuesta =
    await apiClient.post<Proyecto>(
      "/proyectos",
      datos
    );

  return respuesta.data;
}

// Edita los datos o el estado de un proyecto.
export async function actualizarProyecto(
  idProyecto: number,
  datos: ActualizarProyectoRequest
): Promise<Proyecto> {
  const respuesta =
    await apiClient.put<Proyecto>(
      `/proyectos/${idProyecto}`,
      datos
    );

  return respuesta.data;
}

// Elimina un proyecto sin familias ni estaciones.
export async function eliminarProyecto(
  idProyecto: number
): Promise<void> {
  await apiClient.delete(
    `/proyectos/${idProyecto}`
  );
}