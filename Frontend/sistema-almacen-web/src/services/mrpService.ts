import {
  apiClient,
} from "../api/apiClient";

export interface RequerimientoMrp {
  idMaterial: number | null;
  tipoMaterial: string | null;
  tipoCoincidencia: string;
  requiereRevision: boolean;
  idRequerimiento: number;
  idImportacion: number;
  numeroRequisicion: string | null;
  numeroMaterial: string;
  nombreMaterial: string | null;
  familia: string | null;
  proyecto: string | null;
  fechaEta: string;
  cantidadRequerida: number;
  packSize: number;
  bolsasNecesarias: number;
}

export interface RequerimientosMrpPagina {
  registros: RequerimientoMrp[];
  totalRegistros: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface FiltrosMrp {
  proyectos: string[];
  familias: string[];
  fechaMinima: string | null;
  fechaMaxima: string | null;
}

export interface ImportacionMrpResultado {
  mensaje: string;
  idImportacion: number;
  nombreArchivo: string;
  fechaInicio: string;
  fechaFin: string;
  totalRegistros: number;
  registrosImportados: number;
  registrosRechazados: number;
  errores: string[];
}

export interface ConsultarMrpParametros {
  busqueda?: string;
  proyecto?: string;
  familia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  tamanoPagina?: number;

  // Permite seleccionar varios tipos:
  // C, P, S y W.
  tiposMaterial?: string[];
}

// Importa el archivo semanal MRP.
export async function importarArchivoMrp(
  archivo: File
): Promise<ImportacionMrpResultado> {
  const datos =
    new FormData();

  datos.append(
    "archivo",
    archivo
  );

  const respuesta =
    await apiClient.post<ImportacionMrpResultado>(
      "/mrp/importar",
      datos
    );

  return respuesta.data;
}

export async function obtenerRequerimientosMrp(
  parametros: ConsultarMrpParametros
): Promise<RequerimientosMrpPagina> {
  const respuesta =
    await apiClient.get<RequerimientosMrpPagina>(
      "/mrp/requerimientos",
      {
        params: {
          busqueda:
            parametros.busqueda,

          proyecto:
            parametros.proyecto,

          familia:
            parametros.familia,

          tiposMaterial:
            parametros.tiposMaterial
              ?.join(","),

          fechaDesde:
            parametros.fechaDesde,

          fechaHasta:
            parametros.fechaHasta,

          pagina:
            parametros.pagina,

          tamanoPagina:
            parametros.tamanoPagina,
        },
      }
    );

  return respuesta.data;
}


// Obtiene proyectos, familias y fechas disponibles.
export async function obtenerFiltrosMrp():
  Promise<FiltrosMrp> {
  const respuesta =
    await apiClient.get<FiltrosMrp>(
      "/mrp/filtros"
    );

  return respuesta.data;
}