import {
  apiClient,
} from "../api/apiClient";

export interface ErrorImportacionBom {
  numeroFila: number;
  mensaje: string;
}

export interface AdvertenciaImportacionBom {
  numeroFila: number;
  mensaje: string;
}

export interface ResultadoImportacionBom {
  nombreArchivo: string;
  totalFilas: number;
  filasCorrectas: number;
  filasConAdvertencia: number;
  filasConError: number;
  errores: ErrorImportacionBom[];
  advertencias: AdvertenciaImportacionBom[];
}

export interface RespuestaImportacionBom {
  idImportacion: number;
  resultado: ResultadoImportacionBom;
}

export interface ImportarBomRequest {
  archivo: File;
  idFamilia: number;
  nivelDiseno: string;
  version: string;
}

// Envía el archivo Excel al Backend.
export async function importarBom(
  datos: ImportarBomRequest
): Promise<RespuestaImportacionBom> {
  const formulario =
    new FormData();

  formulario.append(
    "archivo",
    datos.archivo
  );

  formulario.append(
    "idFamilia",
    String(datos.idFamilia)
  );

  formulario.append(
    "nivelDiseno",
    datos.nivelDiseno.trim()
  );

  formulario.append(
    "version",
    datos.version.trim()
  );

  const respuesta =
    await apiClient.post<RespuestaImportacionBom>(
      "/bom/importar",
      formulario
    );

  return respuesta.data;
}