import {
  apiClient,
} from "../api/apiClient";

export interface ErrorImportacionMaterialKit {
  hoja: string;
  numeroFila: number;
  mensaje: string;
}

export interface ResultadoImportacionMaterialKit {
  nombreArchivo: string;
  totalFilas: number;
  filasCorrectas: number;
  filasConError: number;
  kitsCreados: number;
  kitsActualizados: number;
  kitsSinCambios: number;
  errores: ErrorImportacionMaterialKit[];
}

export interface RespuestaImportacionMaterialKit {
  mensaje: string;
  resultado: ResultadoImportacionMaterialKit;
}

// Importa el archivo PICSFR010.
export async function importarMaterialKits(
  archivo: File
): Promise<RespuestaImportacionMaterialKit> {
  const datos =
    new FormData();

  datos.append(
    "archivo",
    archivo
  );

  const respuesta =
    await apiClient.post<
      RespuestaImportacionMaterialKit
    >(
      "/material-kits/importar",
      datos,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },

        // El archivo contiene muchos registros.
        timeout: 0,
      }
    );

  return respuesta.data;
}