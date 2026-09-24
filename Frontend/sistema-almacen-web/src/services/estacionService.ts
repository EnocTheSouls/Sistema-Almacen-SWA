import { apiClient } from "../api/apiClient";
import type { Estacion } from "../types/estacion";

export interface CrearEstacionRequest {
  idFamilia: number;
  nombre: string;
}

export interface ActualizarEstacionRequest {
  idFamilia: number;
  nombre: string;
  activo: boolean;
}
export interface ErrorImportacionEstacion {
  numeroFila: number;
  mensaje: string;
}

export interface AdvertenciaImportacionEstacion {
  numeroFila: number;
  mensaje: string;
}

export interface ResultadoImportacionEstacion {
  nombreArchivo: string;
  totalFilas: number;
  filasCorrectas: number;
  filasConError: number;
  filasConAdvertencia: number;
  estacionesCreadas: number;
  estacionesExistentes: number;
  asignacionesRealizadas: number;
  errores: ErrorImportacionEstacion[];
  advertencias: AdvertenciaImportacionEstacion[];
}

export interface RespuestaImportacionEstacion {
  mensaje: string;
  resultado: ResultadoImportacionEstacion;
}

// Obtiene todas las estaciones.
export async function obtenerEstaciones(): Promise<Estacion[]> {
  const respuesta =
    await apiClient.get<Estacion[]>(
      "/estaciones"
    );

  return respuesta.data;
}

//FUNCIONES//

// Obtiene las estaciones de una familia.
export async function obtenerEstacionesPorFamilia(
  idFamilia: number
): Promise<Estacion[]> {
  const respuesta =
    await apiClient.get<Estacion[]>(
      `/estaciones/familia/${idFamilia}`
    );

  return respuesta.data;
}

// Registra una estación asociada a una familia.
export async function crearEstacion(
  datos: CrearEstacionRequest
): Promise<Estacion> {
  const respuesta =
    await apiClient.post<Estacion>(
      "/estaciones",
      datos
    );

  return respuesta.data;
}

// Edita una estación.
export async function actualizarEstacion(
  idEstacion: number,
  datos: ActualizarEstacionRequest
): Promise<Estacion> {
  const respuesta =
    await apiClient.put<Estacion>(
      `/estaciones/${idEstacion}`,
      datos
    );

  return respuesta.data;
}

// Activa o desactiva una estación.
export async function cambiarEstadoEstacion(
  idEstacion: number,
  activo: boolean
): Promise<void> {
  await apiClient.patch(
    `/estaciones/${idEstacion}/estado`,
    null,
    {
      params: {
        activo,
      },
    }
  );
}

// Elimina una estación sin solicitudes relacionadas.
export async function eliminarEstacion(
  idEstacion: number
): Promise<void> {
  await apiClient.delete(
    `/estaciones/${idEstacion}`
  );
}

// Importa estaciones oficiales para una familia.
export async function importarEstaciones(
  idFamilia: number,
  archivo: File
): Promise<RespuestaImportacionEstacion> {
  const formData =
    new FormData();

  formData.append(
    "archivo",
    archivo
  );

  const respuesta =
    await apiClient.post<
      RespuestaImportacionEstacion
    >(
      `/estaciones/importar/${idFamilia}`,
      formData
    );

  return respuesta.data;
}


