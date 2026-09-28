import {
    apiClient,
} from "../api/apiClient";

export interface ErrorImportacionEstacion {
    numeroFila: number;
    numeroArnes: string;
    numeroMaterial: string;
    estacion: string;
    mensaje: string;
}

export interface ResultadoImportacionEstaciones {
    nombreArchivo: string;
    totalFilas: number;
    filasCorrectas: number;
    filasSinEstacion: number;
    filasConError: number;
    asignacionesRealizadas: number;
    asignacionesActualizadas: number;
    errores: ErrorImportacionEstacion[];
}

export interface RespuestaImportacionEstaciones {
    mensaje: string;

    resultado:
    ResultadoImportacionEstaciones;
}

export interface ImportarEstacionesRequest {
    archivo: File;
}

// Envía el Excel que relaciona
// materiales con estaciones.
export async function importarEstacionesMateriales(
    datos: ImportarEstacionesRequest
): Promise<RespuestaImportacionEstaciones> {
    const formulario =
        new FormData();

    formulario.append(
        "archivo",
        datos.archivo
    );

    const respuesta =
        await apiClient.post<
            RespuestaImportacionEstaciones
        >(
            "/materiales/importar-estaciones",
            formulario
        );

    return respuesta.data;
}

export interface MaterialQrContexto {
    idBomDetalle: number;

    idProyecto: number;
    proyecto: string;

    idFamilia: number;
    familia: string;

    idArnes: number;
    numeroArnes: string;
    disenoArnes: string;

    idEstacion: number;
    estacion: string;

    idMaterial: number;
    numeroParteMaterial: string;
    descripcion: string;
    genericCode: string;

    unidadMedida: string | null;
    tipoEmpaque: string | null;
    stdPack: number | null;
}

export interface ValidarMaterialQrRequest {
    contenidoQr: string;
}
// Valida el QR contextual contra
// la estructura real del BOM.
export async function validarMaterialQr(
  contenidoQr: string
): Promise<MaterialQrContexto> {
  const respuesta =
    await apiClient.post<
      MaterialQrContexto
    >(
      "/materiales/validar-qr",
      {
        contenidoQr:
          contenidoQr.trim(),
      } satisfies ValidarMaterialQrRequest
    );

  return respuesta.data;
}