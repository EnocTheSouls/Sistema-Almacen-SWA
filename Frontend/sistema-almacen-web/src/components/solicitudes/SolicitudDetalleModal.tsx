import {
    useMemo,
    useState,
} from "react";

import axios from "axios";

import {
    cambiarEstadoSolicitud,
    eliminarMaterialSolicitud,
    surtirMaterialSolicitud,
} from "../../services/solicitudService";

import type {
    Solicitud,
} from "../../types/solicitud";

interface SolicitudDetalleModalProps {
    solicitud: Solicitud;

    onCerrar: () => void;

    onSolicitudActualizada: (
        solicitud: Solicitud,
        mensaje: string
    ) => void;
}

export function SolicitudDetalleModal({
    solicitud,
    onCerrar,
    onSolicitudActualizada,
}: SolicitudDetalleModalProps) {
    const [
        solicitudActual,
        setSolicitudActual,
    ] = useState(solicitud);

    const [
        actualizando,
        setActualizando,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        mensajeExito,
        setMensajeExito,
    ] = useState("");

    const [
        cantidadesSurtir,
        setCantidadesSurtir,
    ] = useState<Record<number, string>>(
        {}
    );

    const [
        detalleProcesando,
        setDetalleProcesando,
    ] = useState<number | null>(
        null
    );

    const [
        detalleEliminando,
        setDetalleEliminando,
    ] = useState<number | null>(
        null
    );

    // Filtra los materiales visibles del detalle.
    const [
        busquedaMaterial,
        setBusquedaMaterial,
    ] = useState("");

    const [
        filtroMaterial,
        setFiltroMaterial,
    ] = useState<
        "TODOS" |
        "PENDIENTES" |
        "PARCIALES" |
        "SURTIDOS"
    >("TODOS");

    // Filtra y ordena los materiales
    // según su avance de surtido.
    const materialesOrdenados =
        useMemo(() => {
            const texto =
                busquedaMaterial
                    .trim()
                    .toLocaleLowerCase(
                        "es-MX"
                    );

            const obtenerPrioridad = (
                cantidadSolicitada: number,
                cantidadSurtida: number
            ) => {
                if (cantidadSurtida === 0) {
                    return 1;
                }

                if (
                    cantidadSurtida <
                    cantidadSolicitada
                ) {
                    return 2;
                }

                return 3;
            };

            return solicitudActual.materiales
                .filter((material) => {
                    const pendiente =
                        material.cantidadSolicitada -
                        material.cantidadSurtida;

                    const coincideTexto =
                        !texto ||
                        material
                            .numeroParteMaterial
                            .toLocaleLowerCase(
                                "es-MX"
                            )
                            .includes(texto) ||
                        material
                            .descripcionMaterial
                            .toLocaleLowerCase(
                                "es-MX"
                            )
                            .includes(texto) ||
                        (
                            material
                                .nombreEstacion ??
                            ""
                        )
                            .toLocaleLowerCase(
                                "es-MX"
                            )
                            .includes(texto);

                    if (!coincideTexto) {
                        return false;
                    }

                    if (
                        filtroMaterial ===
                        "PENDIENTES"
                    ) {
                        return (
                            material.cantidadSurtida ===
                            0
                        );
                    }

                    if (
                        filtroMaterial ===
                        "PARCIALES"
                    ) {
                        return (
                            material.cantidadSurtida >
                            0 &&
                            pendiente > 0
                        );
                    }

                    if (
                        filtroMaterial ===
                        "SURTIDOS"
                    ) {
                        return pendiente === 0;
                    }

                    return true;
                })
                .sort(
                    (
                        materialA,
                        materialB
                    ) => {
                        const prioridadA =
                            obtenerPrioridad(
                                materialA
                                    .cantidadSolicitada,
                                materialA
                                    .cantidadSurtida
                            );

                        const prioridadB =
                            obtenerPrioridad(
                                materialB
                                    .cantidadSolicitada,
                                materialB
                                    .cantidadSurtida
                            );

                        return (
                            prioridadA -
                            prioridadB
                        );
                    }
                );
        }, [
            solicitudActual.materiales,
            busquedaMaterial,
            filtroMaterial,
        ]);


    // Cancela completamente la solicitud.
    const cancelarSolicitud = async () => {
        setError("");
        setMensajeExito("");

        const confirmar =
            window.confirm(
                `¿Cancelar la solicitud #${solicitudActual.idSolicitud}?`
            );

        if (!confirmar) {
            return;
        }

        try {
            setActualizando(true);

            const respuesta =
                await cambiarEstadoSolicitud(
                    solicitudActual.idSolicitud,
                    8
                );

            setSolicitudActual(
                respuesta.solicitud
            );

            setMensajeExito(
                respuesta.mensaje
            );

            onSolicitudActualizada(
                respuesta.solicitud,
                respuesta.mensaje
            );
        } catch (errorCancelacion) {
            console.error(
                "Error al cancelar solicitud:",
                errorCancelacion
            );

            if (
                axios.isAxiosError(
                    errorCancelacion
                )
            ) {
                const mensaje =
                    errorCancelacion.response
                        ?.data?.mensaje ??
                    errorCancelacion.response
                        ?.data?.detail;

                if (
                    typeof mensaje ===
                    "string"
                ) {
                    setError(mensaje);
                    return;
                }
            }

            setError(
                "No se pudo cancelar la solicitud."
            );
        } finally {
            setActualizando(false);
        }
    };




    const eliminarMaterial = async (
        idDetalle: number,
        numeroParteMaterial: string
    ) => {
        setError("");
        setMensajeExito("");

        const confirmar =
            window.confirm(
                `¿Eliminar el material ${numeroParteMaterial} de esta solicitud?`
            );

        if (!confirmar) {
            return;
        }

        try {
            setDetalleEliminando(
                idDetalle
            );

            const respuesta =
                await eliminarMaterialSolicitud(
                    solicitudActual.idSolicitud,
                    idDetalle
                );

            setSolicitudActual(
                respuesta.solicitud
            );

            setCantidadesSurtir({});

            setMensajeExito(
                respuesta.mensaje
            );

            onSolicitudActualizada(
                respuesta.solicitud,
                respuesta.mensaje
            );
        } catch (errorEliminacion) {
            console.error(
                "Error al eliminar material:",
                errorEliminacion
            );

            if (
                axios.isAxiosError(
                    errorEliminacion
                )
            ) {
                const mensajeBackend =
                    errorEliminacion.response
                        ?.data?.mensaje ??
                    errorEliminacion.response
                        ?.data?.detail;

                if (
                    typeof mensajeBackend ===
                    "string"
                ) {
                    setError(
                        mensajeBackend
                    );

                    return;
                }
            }

            setError(
                "No se pudo eliminar el material de la solicitud."
            );
        } finally {
            setDetalleEliminando(
                null
            );
        }
    };
    const registrarSurtido = async (
        idDetalle: number
    ) => {
        setError("");
        setMensajeExito("");

        const cantidadTexto =
            cantidadesSurtir[idDetalle] ?? "";

        const cantidad =
            Number(cantidadTexto);

        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {
            setError(
                "Captura una cantidad surtida mayor que cero."
            );

            return;
        }

        try {
            setDetalleProcesando(idDetalle);

            const respuesta =
                await surtirMaterialSolicitud(
                    solicitudActual.idSolicitud,
                    {
                        idDetalle,
                        cantidad,
                    }
                );

            setSolicitudActual(
                respuesta.solicitud
            );

            setCantidadesSurtir({});


            setMensajeExito(
                respuesta.mensaje
            );

            onSolicitudActualizada(
                respuesta.solicitud,
                respuesta.mensaje
            );
        } catch (errorSurtido) {
            console.error(
                "Error al registrar surtido:",
                errorSurtido
            );

            if (
                axios.isAxiosError(
                    errorSurtido
                )
            ) {
                const mensajeBackend =
                    errorSurtido.response
                        ?.data?.mensaje ??
                    errorSurtido.response
                        ?.data?.detail;

                if (
                    typeof mensajeBackend ===
                    "string"
                ) {
                    setError(
                        mensajeBackend
                    );

                    return;
                }
            }

            setError(
                "No se pudo registrar la cantidad surtida."
            );
        } finally {
            setDetalleProcesando(null);
        }
    };

    const cerrarModal = () => {
        if (
            actualizando ||
            detalleProcesando !== null ||
            detalleEliminando !== null
        ) {
            return;
        }

        onCerrar();
    };
    return (
        <div style={overlayStyle}>
            <section style={modalStyle}>
                <div style={headerStyle}>
                    <div>
                        <h2 style={titleStyle}>
                            Solicitud #
                            {
                                solicitudActual.idSolicitud
                            }
                        </h2>

                        <p style={descriptionStyle}>
                            Detalle completo de la
                            petición de materiales.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={cerrarModal}
                        disabled={
                            actualizando ||
                            detalleProcesando !== null ||
                            detalleEliminando !== null
                        }
                        style={closeButtonStyle}
                        aria-label="Cerrar detalle"
                    >
                        ×
                    </button>
                </div>

                <div style={summaryGridStyle}>
                    <Dato
                        etiqueta="Proyecto"
                        valor={
                            solicitudActual.nombreProyecto
                        }
                    />

                    <Dato
                        etiqueta="Familia"
                        valor={
                            solicitudActual.nombreFamilia
                        }
                    />

                    <Dato
                        etiqueta="Estado"
                        valor={
                            solicitudActual.nombreEstado
                        }
                    />

                    <Dato
                        etiqueta="Solicitante"
                        valor={
                            solicitudActual
                                .nombreUsuarioSolicitud
                        }
                    />

                    <Dato
                        etiqueta="Fecha"
                        valor={formatearFecha(
                            solicitudActual.fechaSolicitud
                        )}
                    />
                </div>

                {mensajeExito && (
                    <div style={successStyle}>
                        {mensajeExito}
                    </div>
                )}

                {error && (
                    <div style={errorStyle}>
                        {error}
                    </div>
                )}

                <h3 style={sectionTitleStyle}>
                    Materiales solicitados
                </h3>
                <div style={materialFiltersStyle}>
                    <div style={materialFilterGroupStyle}>
                        <label
                            htmlFor="buscarMaterialDetalle"
                            style={filterLabelStyle}
                        >
                            Buscar material
                        </label>

                        <input
                            id="buscarMaterialDetalle"
                            type="text"
                            value={busquedaMaterial}
                            onChange={(event) => {
                                setBusquedaMaterial(
                                    event.target.value
                                );
                            }}
                            placeholder="Número de parte, descripción o estación"
                            style={materialFilterInputStyle}
                        />
                    </div>

                    <div style={materialFilterGroupStyle}>
                        <label
                            htmlFor="filtroMaterialDetalle"
                            style={filterLabelStyle}
                        >
                            Estado del material
                        </label>

                        <select
                            id="filtroMaterialDetalle"
                            value={filtroMaterial}
                            onChange={(event) => {
                                setFiltroMaterial(
                                    event.target.value as
                                    | "TODOS"
                                    | "PENDIENTES"
                                    | "PARCIALES"
                                    | "SURTIDOS"
                                );
                            }}
                            style={materialFilterInputStyle}
                        >
                            <option value="TODOS">
                                Todos
                            </option>

                            <option value="PENDIENTES">
                                Pendientes
                            </option>

                            <option value="PARCIALES">
                                Parciales
                            </option>

                            <option value="SURTIDOS">
                                Surtidos
                            </option>
                        </select>
                    </div>
                </div>


                <div style={tableContainerStyle}>
                    <table style={tableStyle}>

                        <thead>
                            <tr style={headerRowStyle}>
                                <th style={thStyle}>
                                    Material
                                </th>

                                <th style={thStyle}>
                                    Descripción
                                </th>

                                <th style={thStyle}>
                                    Solicitado
                                </th>

                                <th style={thStyle}>
                                    Surtido
                                </th>

                                <th style={thStyle}>
                                    Pendiente
                                </th>

                                <th style={thStyle}>
                                    Estación
                                </th>

                                <th
                                    style={{
                                        ...thStyle,
                                        width: "150px",
                                    }}
                                >
                                    Registrar surtido
                                </th>
                                <th
                                    aria-label="Estado o eliminación"
                                    style={{
                                        ...thStyle,
                                        width: "72px",
                                        paddingLeft: "2px",
                                        paddingRight: "6px",
                                    }}
                                />
                            </tr>
                        </thead>


                        <tbody>
                            {materialesOrdenados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        style={emptyResultsStyle}
                                    >
                                        No hay materiales que
                                        coincidan con la búsqueda
                                        y el filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                materialesOrdenados.map(
                                    (material) => {
                                        const pendiente =
                                            material.cantidadSolicitada -
                                            material.cantidadSurtida;

                                        return (
                                            <tr
                                                key={
                                                    material.idDetalle
                                                }
                                            >
                                                <td style={tdStyle}>
                                                    <strong>
                                                        {
                                                            material.numeroParteMaterial
                                                        }
                                                    </strong>
                                                </td>

                                                <td style={tdStyle}>
                                                    {
                                                        material.descripcionMaterial
                                                    }
                                                </td>

                                                <td style={tdStyle}>
                                                    {
                                                        material.cantidadSolicitada
                                                    }
                                                </td>

                                                <td style={tdStyle}>
                                                    {
                                                        material.cantidadSurtida
                                                    }
                                                </td>

                                                <td style={tdStyle}>
                                                    {pendiente}
                                                </td>
                                                <td style={tdStyle}>
                                                    <strong
                                                        style={{
                                                            color: "#102957",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {material.nombreEstacion ??
                                                            solicitudActual.nombreEstacion ??
                                                            "Sin estación"}
                                                    </strong>
                                                </td>
                                                <td style={tdStyle}>
                                                    {pendiente > 0 &&
                                                        solicitudActual.idEstado !== 6 &&
                                                        solicitudActual.idEstado !== 7 &&
                                                        solicitudActual.idEstado !== 8 ? (
                                                        <div style={supplyControlsStyle}>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                step="1"
                                                                max={pendiente}
                                                                value={
                                                                    cantidadesSurtir[
                                                                    material.idDetalle
                                                                    ] ?? ""
                                                                }
                                                                onChange={(event) => {
                                                                    const valor =
                                                                        event.target.value;

                                                                    setCantidadesSurtir(
                                                                        (cantidadesActuales) => ({
                                                                            ...cantidadesActuales,
                                                                            [material.idDetalle]:
                                                                                valor,
                                                                        })
                                                                    );

                                                                    setError("");
                                                                }}
                                                                disabled={
                                                                    detalleProcesando !== null
                                                                }
                                                                placeholder={`Máx. ${pendiente}`}
                                                                style={supplyInputStyle}
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    registrarSurtido(
                                                                        material.idDetalle
                                                                    )
                                                                }
                                                                disabled={
                                                                    detalleProcesando !== null
                                                                }
                                                                style={{
                                                                    ...supplyButtonStyle,
                                                                    opacity:
                                                                        detalleProcesando !== null
                                                                            ? 0.65
                                                                            : 1,
                                                                }}
                                                            >
                                                                {detalleProcesando ===
                                                                    material.idDetalle
                                                                    ? "Surtiendo..."
                                                                    : "Surtir"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                color: "#94a3b8",
                                                                fontWeight: "700",
                                                            }}
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={lastColumnStyle}>
                                                    {material.cantidadSurtida === 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                eliminarMaterial(
                                                                    material.idDetalle,
                                                                    material.numeroParteMaterial
                                                                )
                                                            }
                                                            disabled={
                                                                detalleProcesando !== null ||
                                                                detalleEliminando !== null ||
                                                                actualizando
                                                            }
                                                            style={{
                                                                ...deleteMaterialButtonStyle,

                                                                opacity:
                                                                    detalleProcesando !== null ||
                                                                        detalleEliminando !== null ||
                                                                        actualizando
                                                                        ? 0.65
                                                                        : 1,

                                                                cursor:
                                                                    detalleProcesando !== null ||
                                                                        detalleEliminando !== null ||
                                                                        actualizando
                                                                        ? "not-allowed"
                                                                        : "pointer",
                                                            }}
                                                        >
                                                            {detalleEliminando ===
                                                                material.idDetalle
                                                                ? "Eliminando..."
                                                                : "Eliminar"}
                                                        </button>
                                                    ) : pendiente > 0 ? (
                                                        <span style={materialPartialStyle}>
                                                            Parcial
                                                        </span>
                                                    ) : (
                                                        <span style={materialCompletedStyle}>
                                                            Surtido
                                                        </span>
                                                    )}
                                                </td>

                                            </tr>
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={actionsStyle}>
                    {solicitudActual.idEstado !== 6 &&
                        solicitudActual.idEstado !== 7 &&
                        solicitudActual.idEstado !== 8 && (
                            <button
                                type="button"
                                onClick={
                                    cancelarSolicitud
                                }
                                disabled={
                                    actualizando ||
                                    detalleProcesando !== null ||
                                    detalleEliminando !== null
                                }
                                style={{
                                    ...cancelRequestButtonStyle,

                                    opacity:
                                        actualizando ||
                                            detalleProcesando !== null ||
                                            detalleEliminando !== null
                                            ? 0.65
                                            : 1,
                                }}
                            >
                                {actualizando
                                    ? "Cancelando..."
                                    : "Cancelar solicitud"}
                            </button>
                        )}

                    <button
                        type="button"
                        onClick={cerrarModal}
                        disabled={
                            actualizando ||
                            detalleProcesando !== null ||
                            detalleEliminando !== null
                        }
                        style={primaryButtonStyle}
                    >
                        Cerrar
                    </button>
                </div>
            </section>
        </div>
    );
}

interface DatoProps {
    etiqueta: string;
    valor: string;
}

function Dato({
    etiqueta,
    valor,
}: DatoProps) {
    return (
        <div style={dataCardStyle}>
            <span style={dataLabelStyle}>
                {etiqueta}
            </span>

            <strong style={dataValueStyle}>
                {valor || "Sin información"}
            </strong>
        </div>
    );
}

function formatearFecha(
    fecha: string
) {
    const fechaConvertida =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaConvertida.getTime()
        )
    ) {
        return fecha;
    }

    return fechaConvertida.toLocaleString(
        "es-MX"
    );
}

const overlayStyle = {
    position: "fixed" as const,
    inset: 0,
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box" as const,
    background:
        "rgba(15, 23, 42, 0.58)",
};

const modalStyle = {
    width: "100%",
    maxWidth: "950px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    boxSizing: "border-box" as const,
    padding: "28px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
        "0 25px 70px rgba(15, 23, 42, 0.3)",
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
};

const titleStyle = {
    margin: 0,
    color: "#102957",
};

const descriptionStyle = {
    margin: "7px 0 0",
    color: "#64748b",
};

const closeButtonStyle = {
    width: "38px",
    height: "38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#475569",
    fontSize: "24px",
    cursor: "pointer",
};

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "22px",
};

const dataCardStyle = {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
};

const dataLabelStyle = {
    display: "block",
    marginBottom: "5px",
    color: "#64748b",
    fontSize: "12px",
};

const dataValueStyle = {
    color: "#102957",
    fontSize: "14px",
};


const successStyle = {
    marginBottom: "18px",
    padding: "13px 15px",
    border: "1px solid #bbf7d0",
    borderRadius: "9px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "14px",
    fontWeight: "700",
};

const errorStyle = {
    marginBottom: "18px",
    padding: "13px 15px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: "14px",
};

const sectionTitleStyle = {
    margin: "0 0 14px",
    color: "#102957",
};

const tableContainerStyle = {
    overflowX: "auto" as const,
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
};

const headerRowStyle = {
    background: "#f8fafc",
};

const thStyle = {
    padding: "9px 7px",
    borderBottom:
        "2px solid #e2e8f0",
    color: "#102957",
    fontSize: "12px",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
};
const tdStyle = {
    padding: "10px 8px",
    borderBottom:
        "1px solid #e5e7eb",
    color: "#334155",
    fontSize: "13px",
    verticalAlign: "middle" as const,
};

const actionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap" as const,
    gap: "9px",
    marginTop: "22px",
};

const primaryButtonStyle = {
    minHeight: "42px",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#102957",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
};


const supplyControlsStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: "145px",
};

const supplyInputStyle = {
    width: "76px",
    minHeight: "34px",
    boxSizing: "border-box" as const,
    padding: "5px 7px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    color: "#102957",
    fontSize: "12px",
};
const supplyButtonStyle = {
    minHeight: "34px",
    padding: "5px 9px",
    border: "none",
    borderRadius: "7px",
    background: "#1d4ed8",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
};

const deleteMaterialButtonStyle = {
    minHeight: "35px",
    padding: "6px 10px",
    border: "1px solid #fecaca",
    borderRadius: "7px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
};

const materialPendingStyle = {
    display: "inline-block",
    minWidth: "54px",
    padding: "5px 7px",
    borderRadius: "999px",
    background: "#ffedd5",
    color: "#c2410c",
    fontSize: "11px",
    fontWeight: "800",
    textAlign: "center" as const,
};

const materialPartialStyle = {
    ...materialPendingStyle,
    background: "#fef3c7",
    color: "#92400e",
};

const materialCompletedStyle = {
    ...materialPendingStyle,
    background: "#dcfce7",
    color: "#166534",
};

const lastColumnStyle = {
    ...tdStyle,
    width: "72px",
    paddingLeft: "2px",
    paddingRight: "6px",
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
};



const materialFiltersStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "10px",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    marginBottom: "14px",
    padding: "12px",
    boxSizing: "border-box" as const,
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
};

const materialFilterGroupStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
};

const filterLabelStyle = {
    color: "#17335f",
    fontSize: "12px",
    fontWeight: "700",
};

const materialFilterInputStyle = {
    display: "block",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    minHeight: "40px",
    boxSizing: "border-box" as const,
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#102957",
    fontSize: "13px",
    outline: "none",
};

const emptyResultsStyle = {
    padding: "25px 14px",
    color: "#64748b",
    fontSize: "13px",
    textAlign: "center" as const,
};

const cancelRequestButtonStyle = {
    minHeight: "42px",
    padding: "10px 18px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontWeight: "700",
    cursor: "pointer",
};
