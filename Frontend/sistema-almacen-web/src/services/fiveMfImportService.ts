import {
  apiClient,
} from "../api/apiClient";

export interface ErrorImportacionFiveMf {
  numeroFila: number;
  familia: string | null;
  numeroArnes: string | null;
  nivelDiseno: string | null;
  mensaje: string;
}

export interface AdvertenciaImportacionFiveMf {
  numeroFila: number;
  familia: string | null;
  numeroArnes: string | null;
  nivelDiseno: string | null;
  mensaje: string;
}

export interface ResultadoImportacionFiveMf {
  nombreArchivo: string;
  totalFilas: number;
  filasCorrectas: number;
  filasConAdvertencia: number;
  filasConError: number;
  familiasEncontradas: number;
  familiasSinCoincidencia: number;
  arnesesCreados: number;
  arnesesExistentes: number;
  planesSemanalesGuardados: number;
  errores: ErrorImportacionFiveMf[];
  advertencias: AdvertenciaImportacionFiveMf[];
}

export interface RespuestaImportacionFiveMf {
  idImportacion: number;
  mensaje: string;
  resultado: ResultadoImportacionFiveMf;
}

export async function importarFiveMf(
  archivo: File
) {
  const formulario =
    new FormData();

  formulario.append(
    "archivo",
    archivo
  );

  const respuesta =
    await apiClient.post<RespuestaImportacionFiveMf>(
      "/5mf/importar",
      formulario,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

  return respuesta.data;
}