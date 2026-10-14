import { apiClient } from "../api/apiClient";

import type {
  MaterialEstacion,
} from "../types/materialEstacion";

// Obtiene los materiales relacionados
// con los detalles BOM y sus estaciones.
export async function
  obtenerMaterialesPorEstacion():
  Promise<MaterialEstacion[]> {
  const respuesta =
    await apiClient.get<
      MaterialEstacion[]
    >(
      "/proyectos/materiales-estaciones"
    );

  return respuesta.data;
}

export interface CambiarEstacionRequest {
  idEstacion: number;
  motivo: string;
}

export interface ResultadoCambioEstacion {
  idBomDetalle: number;
  idMaterial: number;
  numeroMaterial: string;

  idEstacionAnterior: number | null;
  estacionAnterior: string;

  idEstacionNueva: number;
  estacionNueva: string;

  requiereReemplazarQr: boolean;
  contenidoQr: string;
}

export interface RespuestaCambioEstacion {
  mensaje: string;
  resultado: ResultadoCambioEstacion;
}

// Cambia la estación de un detalle BOM.
export async function cambiarEstacionDetalleBom(
  idBomDetalle: number,
  datos: CambiarEstacionRequest
): Promise<RespuestaCambioEstacion> {
  const respuesta =
    await apiClient.put<RespuestaCambioEstacion>(
      `/proyectos/bom-detalles/${idBomDetalle}/estacion`,
      datos
    );

  return respuesta.data;
}
