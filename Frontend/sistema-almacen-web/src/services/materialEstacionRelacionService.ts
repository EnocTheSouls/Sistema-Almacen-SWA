import {
    apiClient,
} from "../api/apiClient";

// Relación directa entre material y estación.
export interface MaterialEstacionRelacion {
    idMaterialEstacion: number;

    idMaterial: number;
    numeroParteMaterial: string;
    descripcion: string;

    idEstacion: number;
    estacion: string;

    idFamilia: number;
    familia: string;

    activo: boolean;
    contenidoQr: string;
}

export interface RespuestaAgregarMaterialEstacion {
    mensaje: string;
    relacion: MaterialEstacionRelacion;
}

// Obtiene las estaciones asignadas al material.
export async function obtenerEstacionesDeMaterial(
    idMaterial: number
): Promise<MaterialEstacionRelacion[]> {
    const respuesta =
        await apiClient.get<
            MaterialEstacionRelacion[]
        >(
            `/materiales/${idMaterial}/estaciones`
        );

    return respuesta.data;
}

// Relaciona una estación con el material.
export async function agregarEstacionAMaterial(
    idMaterial: number,
    idEstacion: number
): Promise<RespuestaAgregarMaterialEstacion> {
    const respuesta =
        await apiClient.post<
            RespuestaAgregarMaterialEstacion
        >(
            `/materiales/${idMaterial}/estaciones`,
            {
                idEstacion,
            }
        );

    return respuesta.data;
}

// Quita la relación material-estación.
export async function quitarEstacionDeMaterial(
    idMaterial: number,
    idEstacion: number
): Promise<void> {
    await apiClient.delete(
        `/materiales/${idMaterial}/estaciones/${idEstacion}`
    );
}