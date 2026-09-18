import { apiClient } from "../api/apiClient";

import type {
  CrearSolicitudRequest,
  Solicitud,
} from "../types/solicitud";

// Obtiene todas las solicitudes.
export async function obtenerSolicitudes(): Promise<
  Solicitud[]
> {
  const respuesta =
    await apiClient.get<Solicitud[]>(
      "/solicitudes"
    );

  return respuesta.data;
}

// Obtiene una solicitud con todos sus materiales.
export async function obtenerSolicitudPorId(
  idSolicitud: number
): Promise<Solicitud> {
  const respuesta =
    await apiClient.get<Solicitud>(
      `/solicitudes/${idSolicitud}`
    );

  return respuesta.data;
}

// Registra una solicitud con uno o varios materiales.
export async function crearSolicitud(
  datos: CrearSolicitudRequest
): Promise<Solicitud> {
  const respuesta =
    await apiClient.post<Solicitud>(
      "/solicitudes",
      datos
    );

  return respuesta.data;
}

interface CambiarEstadoSolicitudResponse {
  mensaje: string;
  solicitud: Solicitud;
}

// Cambia el estado operativo de una solicitud.
export async function cambiarEstadoSolicitud(
  idSolicitud: number,
  idEstado: number
): Promise<CambiarEstadoSolicitudResponse> {
  const respuesta =
    await apiClient.patch<CambiarEstadoSolicitudResponse>(
      `/solicitudes/${idSolicitud}/estado`,
      {
        idEstado,
      }
    );

  return respuesta.data;
}