import {
    apiClient,
} from "../api/apiClient";

export type EstadoAbastecimiento =
    | "COMPLETADO"
    | "DISPONIBLE"
    | "DISPONIBLE_PARCIAL"
    | "NO_RECIBIDO"
    | "SIN_KITS";

export interface MaterialSurtidoMrp {
    idRequerimiento: number;
    idImportacionMrp: number;

    numeroRequisicion: string | null;

    fecha: string;

    idProyecto: number | null;
    proyecto: string;

    idFamilia: number | null;
    familia: string;

    idMaterial: number | null;
    numeroMaterial: string;
    nombreMaterial: string | null;

    tipoMaterial:
    | "C"
    | "P"
    | "S"
    | "W"
    | null;

    cantidadRequeridaDia: number;
    cantidadSurtidaDia: number;
    cantidadPendienteDia: number;
    cantidadSurtible: number;

    cantidadRequeridaAcumulada: number;
    cantidadSurtidaAcumulada: number;
    cantidadPendienteAcumulada: number;
    cantidadSurtibleAcumulada: number;
    kitsDisponibles: number;
    cantidadDisponible: number;

    kitsNoRecibidos: number;
    cantidadNoRecibida: number;

    estadoSurtido: EstadoAbastecimiento;
}

// Obtiene las fechas cubiertas por
// el PICS semanal activo.
export async function obtenerFechasSurtidoMrp():
    Promise<string[]> {
    const respuesta =
        await apiClient.get<string[]>(
            "/surtido-mrp/fechas"
        );

    return respuesta.data;
}

// Obtiene los proyectos de la fecha.
export async function obtenerProyectosSurtidoMrp(
    fecha: string
): Promise<string[]> {
    const respuesta =
        await apiClient.get<string[]>(
            "/surtido-mrp/proyectos",
            {
                params: {
                    fecha,
                },
            }
        );

    return respuesta.data;
}

// Obtiene las familias del proyecto
// para la fecha seleccionada.
export async function obtenerFamiliasSurtidoMrp(
    fecha: string,
    proyecto: string
): Promise<string[]> {
    const respuesta =
        await apiClient.get<string[]>(
            "/surtido-mrp/familias",
            {
                params: {
                    fecha,
                    proyecto,
                },
            }
        );

    return respuesta.data;
}

// Obtiene el requerimiento diario
// y la disponibilidad física.
export async function obtenerMaterialesSurtidoMrp(
    fecha: string,
    proyecto: string,
    familia: string
): Promise<MaterialSurtidoMrp[]> {
    const respuesta =
        await apiClient.get<MaterialSurtidoMrp[]>(
            "/surtido-mrp/materiales",
            {
                params: {
                    fecha,
                    proyecto,
                    familia,
                },
            }
        );

    return respuesta.data;
}

export interface KitNoRecibidoMrp {
    idMaterialKit: number;
    numeroMaterial: string;
    serialCaja: string;

    numeroAsn: string | null;
    numeroCamion: string | null;
    numeroPallet: string | null;

    cantidad: number;

    estado: string | null;
    localidad: string | null;
    rack: string | null;
    shipFrom: string | null;
}

export interface KitIndividualMrp {
    idMaterialKit: number;

    numeroMaterial: string;
    nombreMaterial: string | null;

    tipoMaterial:
    | "C"
    | "P"
    | "S"
    | "W"
    | null;

    serialCaja: string;

    numeroAsn: string | null;
    numeroCamion: string | null;
    numeroPallet: string | null;

    cantidadInicial: number;
    cantidadDisponible: number;

    estadoOrigen: string | null;
    estadoKit: string;

    localidad: string | null;
    rack: string | null;
    shipFrom: string | null;

    fechaImportacion: string;
    fechaActualizacion: string | null;

    cantidadPendienteDia: number;
    cantidadSurtible: number;
}

// Obtiene únicamente los kits que PICS
// todavía marca como no recibidos.
export async function obtenerKitsNoRecibidosMrp(
    fecha: string,
    proyecto: string,
    familia: string
): Promise<KitNoRecibidoMrp[]> {
    const respuesta =
        await apiClient.get<KitNoRecibidoMrp[]>(
            "/surtido-mrp/kits-no-recibidos",
            {
                params: {
                    fecha,
                    proyecto,
                    familia,
                },
            }
        );

    return respuesta.data;
}

// Obtiene todos los kits PICS
// separados por número de serie.
export async function obtenerKitsIndividualesMrp(
    fecha: string,
    proyecto: string,
    familia: string
): Promise<KitIndividualMrp[]> {
    const respuesta =
        await apiClient.get<KitIndividualMrp[]>(
            "/surtido-mrp/kits-individuales",
            {
                params: {
                    fecha,
                    proyecto,
                    familia,
                },
            }
        );

    return respuesta.data;
}